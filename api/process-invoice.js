import { GoogleGenAI } from '@google/genai';

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

    const ai = new GoogleGenAI({ apiKey });

    // Limpar o prefixo "data:image/jpeg;base64," caso venha do frontend
    const base64Data = imageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, "");

    const fallbackModels = [
      'gemini-3.5-flash',
      'gemini-3.1-flash-image'
    ];

    let response;
    let success = false;
    let errorsLog = [];

    for (const modelName of fallbackModels) {
      try {
        console.log(`A tentar usar o modelo Gemini: ${modelName}`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemPrompt },
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType || "image/jpeg"
                  }
                }
              ]
            }
          ],
          config: {
            temperature: 0.0,
          }
        });
        success = true;
        console.log(`Sucesso com o modelo: ${modelName}`);
        break; // Sai do loop se tiver sucesso
      } catch (err) {
        console.warn(`Falha no modelo ${modelName}:`, err.message);
        errorsLog.push(`${modelName}: ${err.message}`);
        // Continua para o próximo modelo da lista
      }
    }

    if (!success) {
      let availableModelsStr = "Não foi possível verificar a lista de modelos.";
      try {
        const checkRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await checkRes.json();
        if (data && data.models) {
          availableModelsStr = data.models.map(m => m.name.replace('models/', '')).join(', ');
        } else if (data && data.error) {
          availableModelsStr = `Erro ao listar: ${data.error.message}`;
        }
      } catch (e) {
        console.error("Erro ao tentar listar modelos:", e);
      }

      throw new Error(`Nenhum modelo suportado pela sua chave API funcionou. Modelos disponíveis na sua chave: [${availableModelsStr}]. Detalhes dos erros: ${errorsLog.join(' | ')}`);
    }

    let extractedText = response.text;
    
    if (!extractedText) {
      throw new Error("A API Gemini não devolveu qualquer texto de resposta.");
    }
    
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
