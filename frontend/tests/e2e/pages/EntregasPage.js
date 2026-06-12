export class EntregasPage {
    constructor(page) {
        this.page = page;
        this.tabela = page.getByTestId('tabela-entregas');
        this.linhas = page.getByTestId('linha-entrega');
        this.btnLogout = page.getByTestId('btn-logout');
    }

    async visitar() {
        await this.page.goto('/painel'); 
    }

    async deslogar() {
        await this.btnLogout.click();
    }
}