import { test, expect } from '@playwright/test';
import { LoginPage } from '../../frontend/tests/e2e/pages/LoginPage.js';
import { prisma } from '../../src/config/database.js';
import bcrypt from 'bcrypt';

test.describe('Fluxos de Autenticação (E2E)', () => {
    let loginPage;

    test.beforeAll(async () => {
        await prisma.usuario.deleteMany({ where: { email: 'e2e@teste.com' } });
        await prisma.usuario.create({
            data: {
                nome: 'Usuário E2E',
                email: 'e2e@teste.com',
                senha: await bcrypt.hash('senha_e2e_123', 10),
                papel: 'OPERADOR'
            }
        });
    });

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
    });

    test('Login inválido - Deve exibir mensagem de erro e não redirecionar', async ({ page }) => {
        await loginPage.visitar();
        await loginPage.fazerLogin('e2e@teste.com', 'senha_errada');

        await expect(loginPage.erroAlerta).toBeVisible();
        await expect(loginPage.erroAlerta).toContainText('Credenciais inválidas');
        await expect(page).toHaveURL(/\/login/);
    });

    test('Login válido - Deve redirecionar para o painel de entregas', async ({ page }) => {
        await loginPage.visitar();
        await loginPage.fazerLogin('e2e@teste.com', 'senha_e2e_123');

        await page.waitForURL('**/painel*');
        await expect(page).toHaveURL(/.*painel.*/);
    });

    test('Acesso sem autenticação - Navegar para /painel redireciona para /login', async ({ page }) => {
        const resposta = await page.goto('/painel');

        await expect(page).toHaveURL(/\/login/);
    });
});