export class Database {
  constructor() {
    this.entregas = [];
    this.nextIdEntregas = 1;
    this.nextIdMotoristas = 1;
    this.motoristas = [];
 }

 //entregas
  getEntregas() {
    return this.entregas;
  }

  generateIdEntregas() {
    const id = this.nextIdEntregas;
    this.nextIdEntregas++;
    return id;
  }

  setEntregas(dados){
    return this.entregas.push(dados);
  }
    
  atualizar(id,dadosAtualizados){
    const index = this.entregas.findIndex(e => e.id === id);
        if (index === -1) return null;
        this.entregas[index] = {
            ...this.entregas[index],
            ...dadosAtualizados,
            id
        };
    return this.entregas[index];
  }
  
  //motoristas
  generateIdMotoristas(){
    const id = this.nextIdMotoristas;
    this.nextIdMotoristas++;
    return id;
  }
  
  getMotoristas(){
    return this.motoristas;
  }
  
  setMotoristas(dados){
    return this.motoristas.push(dados);
  }

  atualizarMotorista(id, dadosAtualizados){
     const index = this.motoristas.findIndex(e => e.id === id);
    if (index === -1) return null;

    this.motoristas[index] = {
      ...this.motoristas[index],
      ...dadosAtualizados,
      id
    };
    return this.motoristas[index];
  }
}
