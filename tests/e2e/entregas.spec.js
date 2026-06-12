import { test, expect } from '@playwright/test';
import { LoginPage } from '../../frontend/tests/e2e/pages/LoginPage.js';
import { EntregasPage } from '../../frontend/tests/e2e/pages/EntregasPage.js';
import { prisma } from '../../src/config/database.js';
import bcrypt from 'bcrypt';

test.describe('Fluxos de Entregas e Sessão (E2E)', () => {
    let loginPage;
    let entregasPage;

    test.beforeAll(async () => {
        await prisma.entrega.deleteMany();
        await prisma.usuario.deleteMany({ where: { email: 'e2e_lista@teste.com' } });
        
        const user = await prisma.usuario.create({
            data: { nome: 'Lista E2E', email: 'e2e_lista@teste.com', senha: await bcrypt.hash('senha_e2e_123', 10), papel: 'OPERADOR' }
        });

        await prisma.entrega.create({
            data: { descricao: 'Pacote Playwright', origem: 'X', destino: 'Y', status: 'CRIADA', criadorId: user.id }
        });
    });

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        entregasPage = new EntregasPage(page);

        await loginPage.visitar();
        await loginPage.fazerLogin('e2e_lista@teste.com', 'senha_e2e_123');
        await page.waitForURL('**/painel*');
        
        await page.goto('/painel/entregas'); 

        await page.waitForSelector('[data-testid="linha-entrega"]');
    });

    test('Listagem de entregas - A tabela deve ser exibida com ao menos uma linha', async ({ page }) => {
        await expect(entregasPage.tabela).toBeVisible();

        const totalLinhas = await entregasPage.linhas.count();
        expect(totalLinhas).toBeGreaterThan(0);
        
        await expect(entregasPage.tabela).toContainText('Pacote Playwright');
    });

    test('Logout - Clicar em Sair redireciona para /login', async ({ page }) => {
        await entregasPage.deslogar();

        await page.waitForURL(/\/login/);
        await expect(page).toHaveURL(/\/login/);
    });
});