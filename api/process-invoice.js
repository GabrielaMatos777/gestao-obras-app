export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // --------------------------------------------------------------------------------
    // INSTRUÇÃO CRÍTICA DO SISTEMA DE OCR (BACKEND):
    // "És um motor de OCR cego. A tua única função é a extração verbatim (cópia exata, letra a letra) do que está na imagem. 
    // NÃO normalizes nomes de produtos. NÃO inventes categorias. NÃO tentes corrigir a ortografia. 
    // Extrai as linhas de produtos e valores exatamente como estão impressos. Devolve a resposta em formato JSON puro."
    // --------------------------------------------------------------------------------

    // AQUI ENTRARIA A CHAMADA REAL À API DE IA (ex: OpenAI Vision, AWS Textract, etc)
    // Como ainda não temos a chave de API/SDK configurado, estamos a devolver a estrutura
    // JSON estrita para validar a comunicação de rede Vercel <-> Frontend.
    
    // Simular tempo de leitura da IA
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Exemplo de resposta JSON formatada exatamente como o frontend espera
    const responseData = {
      fornecedor: "LEROY MERLIN",
      data: new Date().toISOString().split('T')[0],
      total: 145.50,
      linhas: [
        { descricao: "CIMENTO PORTLAND 25KG SECIL", quantidade: 5, preco_unitario: 6.50 },
        { descricao: "TINTA INT MAT PLAST 15L BR", quantidade: 1, preco_unitario: 113.00 }
      ]
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error("Erro OCR Backend:", error);
    return res.status(500).json({ 
      error: "Falha na leitura de imagem pelo motor de OCR", 
      details: error.message 
    });
  }
}
