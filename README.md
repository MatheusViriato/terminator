# terminator
create table sessao_watson( cel text, mensagem_usuario text, resposta_watson text, contexto text);
insert into sessao_watson(cel, mensagem_usuario, resposta_watson, contexto)values('1', '', '', '');
CREATE TABLE informacao_chat (
cel text,
contexto text,
mensagem_usuario text,
resposta_watson text
)
CREATE TABLE cardapio_combo (
combo_nome text,
descricao text,
unidade int,
preco decimal(6,2)
)
# Tabela sessaowatson
Tabela contendo informações da conversa, como contexto, ultima informação, etc.

// Tabela Chat Informação
// Salvar por celular
// - Todos os contextos
// - Todas as mensagens do usuário 
// - Todas as respostas do watson

// Tabela para salvar detalhes dos pedidos
// Salvar por celular e data
// - Pedido
// - Quantidade
// - Preço
// - Tipo de pagamento
// - Troco
// - Data / Hora

// Tabela com cardápio normal
// - prato
// - unidade
// - preco

// Tabela com cardápio de combos
// - Combo
// - descricao
// - unidade
// - preco