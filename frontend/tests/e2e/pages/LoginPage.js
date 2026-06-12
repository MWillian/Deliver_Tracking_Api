export class LoginPage {
    constructor(page) {
        this.page = page;
        this.emailInput = page.getByTestId('input-email');
        this.senhaInput = page.getByTestId('input-senha');
        this.loginBtn = page.getByTestId('btn-login');
        this.erroAlerta = page.getByTestId('alerta-erro');
    }

    async visitar() {
        await this.page.goto('/login');
    }

    async fazerLogin(email, senha) {
        await this.emailInput.fill(email);
        await this.senhaInput.fill(senha);
        await this.loginBtn.click();
    }
}