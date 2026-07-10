export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Permitir imagens até 10MB
    },
  },
  regions: ['iad1'], // Forçar região dos EUA (Washington) para evitar bloqueios regionais da API Google na Europa
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Validação estrita da chave de ambiente
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: "Chave GEMINI_API_KEY em falta. Se já a adicionou no Vercel, confirme que a caixa 'Production' está selecionada nas definições da variável." 
      });
    }

    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Nenhuma imagem recebida." });
    }

    // --------------------------------------------------------------------------------
    // INSTRUÇÃO CRÍTICA DO SISTEMA DE OCR (BACKEND):
    // --------------------------------------------------------------------------------
    const systemPrompt = `És um motor de OCR cego. A tua única função é a extração verbatim (cópia exata, letra a letra) do que está na imagem.
NÃO normalizes nomes de produtos. NÃO inventes categorias. NÃO tentes corrigir a ortografia.
Extrai as linhas de produtos e valores exatamente como estão impressos.

Devolve a resposta APENAS e EXCLUSIVAMENTE num formato JSON válido e puro com a seguinte estrutura:
{
  "fornecedor": "Nome do Fornecedor",
  "data": "YYYY-MM-DD",
  "total": 0.00,
  "linhas": [
    { "descricao": "CIMENTO PORTLAND 25KG SECIL", "quantidade": 5, "preco_unitario": 6.50 }
  ]
}
Não incluas blocos \`\`\`json ou outro texto fora deste JSON, apenas o próprio JSON. Se não conseguires ler, deixa em branco.`;

    // Chamada à API da Google Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // Limpar o prefixo "data:image/jpeg;base64," caso venha do frontend
    const base64Data = imageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, "");

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              {
                inline_data: {
                  mime_type: mimeType || "image/jpeg",
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.0, // Garantir a máxima determinabilidade, zero criatividade
        }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error details:", errText);
      throw new Error(`Erro na API do Gemini (${response.status})`);
    }

    const result = await response.json();
    
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error("A API Gemini não devolveu candidatos de resposta.");
    }

    let extractedText = result.candidates[0].content.parts[0].text;
    
    // Limpar markdown de JSON se o Gemini o tiver incluído ignorando a instrução
    extractedText = extractedText.trim();
    if (extractedText.startsWith('```json')) {
      extractedText = extractedText.substring(7);
    }
    if (extractedText.endsWith('```')) {
      extractedText = extractedText.substring(0, extractedText.length - 3);
    }
    extractedText = extractedText.trim();

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(extractedText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON:", extractedText);
      throw new Error("O motor de OCR não devolveu um formato JSON válido.");
    }

    return res.status(200).json(jsonResponse);

  } catch (error) {
    console.error("Erro OCR Backend:", error);
    return res.status(500).json({ 
      error: "Falha técnica no motor de leitura (OCR)", 
      details: error.message 
    });
  }
}
