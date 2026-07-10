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
    // Validação estrita da chave de ambiente
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: "Chave de ambiente OPENAI_API_KEY em falta no Vercel. O motor de OCR não pode arrancar." 
      });
    }

    // --------------------------------------------------------------------------------
    // INSTRUÇÃO CRÍTICA DO SISTEMA DE OCR (BACKEND):
    // "És um motor de OCR cego. A tua única função é a extração verbatim (cópia exata, letra a letra) do que está na imagem. 
    // NÃO normalizes nomes de produtos. NÃO inventes categorias. NÃO tentes corrigir a ortografia. 
    // Extrai as linhas de produtos e valores exatamente como estão impressos. Devolve a resposta em formato JSON puro."
    // --------------------------------------------------------------------------------

    // AQUI FARÁ O FETCH REAL PARA A API DA OPENAI (GPT-4 Vision) USANDO A OPENAI_API_KEY
    // Exemplo do código final que executará quando a chave existir:
    /*
      const response = await fetch('https://api.openai.com/v1/chat/completions', { ... });
      const data = await response.json();
      return res.status(200).json(data);
    */

    // Como proibido, NÃO existe mais mock data.
    // Se chegou aqui e o processamento de imagem ainda não estiver implementado para a API real, forçamos um erro para não alucinar.
    throw new Error("Motor de leitura OCR real ainda precisa ser conectado ao payload da imagem com a chave configurada.");

  } catch (error) {
    console.error("Erro OCR Backend:", error);
    return res.status(500).json({ 
      error: "Falha técnica no motor de leitura (OCR)", 
      details: error.message 
    });
  }
}
