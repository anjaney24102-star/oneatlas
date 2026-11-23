/**
 * ILLUSTRATIVE seed dataset (mock / approximate). Prices, release dates and benchmark scores are rounded
 * approximations of publicly reported figures and are NOT authoritative. The point of this file is to give
 * the API realistic, relational data. Use `npm run ingest:openrouter` to pull live specs & pricing.
 */
import { Modality, ModelType } from '@prisma/client';

const T = Modality.TEXT, I = Modality.IMAGE, A = Modality.AUDIO, V = Modality.VIDEO, F = Modality.FILE;

export const labs = [
  { slug: 'openai', name: 'OpenAI', country: 'United States', foundedYear: 2015, websiteUrl: 'https://openai.com', description: 'AI research and deployment company behind the GPT and o-series models.' },
  { slug: 'anthropic', name: 'Anthropic', country: 'United States', foundedYear: 2021, websiteUrl: 'https://www.anthropic.com', description: 'AI safety company building the Claude family of models.' },
  { slug: 'google-deepmind', name: 'Google DeepMind', country: 'United Kingdom', foundedYear: 2010, websiteUrl: 'https://deepmind.google', description: 'Google research lab behind the Gemini models.' },
  { slug: 'meta', name: 'Meta AI', country: 'United States', foundedYear: 2013, websiteUrl: 'https://ai.meta.com', description: 'Meta research lab releasing the open-weights Llama family.' },
  { slug: 'mistral', name: 'Mistral AI', country: 'France', foundedYear: 2023, websiteUrl: 'https://mistral.ai', description: 'European lab releasing open and commercial frontier models.' },
  { slug: 'deepseek', name: 'DeepSeek', country: 'China', foundedYear: 2023, websiteUrl: 'https://www.deepseek.com', description: 'Chinese lab known for efficient open-weights reasoning and chat models.' },
  { slug: 'alibaba-qwen', name: 'Alibaba Qwen', country: 'China', foundedYear: 2023, websiteUrl: 'https://qwenlm.github.io', description: 'Alibaba Cloud team behind the Qwen open-weights models.' },
  { slug: 'xai', name: 'xAI', country: 'United States', foundedYear: 2023, websiteUrl: 'https://x.ai', description: 'Lab behind the Grok models.' },
  { slug: 'cohere', name: 'Cohere', country: 'Canada', foundedYear: 2019, websiteUrl: 'https://cohere.com', description: 'Enterprise-focused LLMs, retrieval and embeddings.' },
  { slug: 'microsoft', name: 'Microsoft', country: 'United States', foundedYear: 1975, websiteUrl: 'https://www.microsoft.com/ai', description: 'Publishes the small, efficient Phi model family among others.' },
  { slug: 'nvidia', name: 'NVIDIA', country: 'United States', foundedYear: 1993, websiteUrl: 'https://www.nvidia.com', description: 'GPU maker that also releases tuned open models (Nemotron).' },
  { slug: 'moonshot-ai', name: 'Moonshot AI', country: 'China', foundedYear: 2023, websiteUrl: 'https://www.moonshot.cn', description: 'Lab behind the Kimi models.' },
  { slug: 'zhipu-ai', name: 'Zhipu AI', country: 'China', foundedYear: 2019, websiteUrl: 'https://z.ai', description: 'Lab behind the GLM model family.' },
  { slug: 'amazon', name: 'Amazon', country: 'United States', foundedYear: 1994, websiteUrl: 'https://aws.amazon.com/ai', description: 'Builds the Nova foundation models served on Bedrock.' },
  { slug: 'ai21-labs', name: 'AI21 Labs', country: 'Israel', foundedYear: 2017, websiteUrl: 'https://www.ai21.com', description: 'Lab behind the hybrid SSM-Transformer Jamba models.' },
];

export const providers = [
  { slug: 'openai-api', name: 'OpenAI API', websiteUrl: 'https://platform.openai.com', description: 'First-party OpenAI inference API.' },
  { slug: 'anthropic-api', name: 'Anthropic API', websiteUrl: 'https://www.anthropic.com/api', description: 'First-party Claude API.' },
  { slug: 'google-vertex', name: 'Google Vertex AI', websiteUrl: 'https://cloud.google.com/vertex-ai', description: 'Google Cloud managed model platform.' },
  { slug: 'azure-openai', name: 'Azure AI Foundry', websiteUrl: 'https://azure.microsoft.com/products/ai-foundry', description: 'Microsoft Azure hosted models.' },
  { slug: 'aws-bedrock', name: 'AWS Bedrock', websiteUrl: 'https://aws.amazon.com/bedrock', description: 'Amazon managed foundation-model service.' },
  { slug: 'together', name: 'Together AI', websiteUrl: 'https://www.together.ai', description: 'Fast inference for open-source models.' },
  { slug: 'fireworks', name: 'Fireworks AI', websiteUrl: 'https://fireworks.ai', description: 'Low-latency open-model inference platform.' },
  { slug: 'groq', name: 'Groq', websiteUrl: 'https://groq.com', description: 'LPU-based ultra-fast inference.' },
  { slug: 'deepinfra', name: 'DeepInfra', websiteUrl: 'https://deepinfra.com', description: 'Cost-efficient hosted open models.' },
  { slug: 'mistral-platform', name: 'Mistral La Plateforme', websiteUrl: 'https://console.mistral.ai', description: 'First-party Mistral API.' },
  { slug: 'deepseek-api', name: 'DeepSeek API', websiteUrl: 'https://platform.deepseek.com', description: 'First-party DeepSeek API.' },
  { slug: 'cohere-api', name: 'Cohere API', websiteUrl: 'https://cohere.com/api', description: 'First-party Cohere API.' },
  { slug: 'xai-api', name: 'xAI API', websiteUrl: 'https://x.ai/api', description: 'First-party Grok API.' },
  { slug: 'moonshot-api', name: 'Moonshot Platform', websiteUrl: 'https://platform.moonshot.ai', description: 'First-party Kimi API.' },
  { slug: 'zhipu-api', name: 'Z.ai Platform', websiteUrl: 'https://docs.z.ai', description: 'First-party GLM API.' },
  { slug: 'openrouter', name: 'OpenRouter', websiteUrl: 'https://openrouter.ai', description: 'Unified API/marketplace routing to many providers.' },
];

export const capabilities = [
  { slug: 'tool-calling', name: 'Tool calling', description: 'Can call developer-defined functions/tools.' },
  { slug: 'vision', name: 'Vision', description: 'Accepts image input.' },
  { slug: 'json-mode', name: 'JSON / structured output', description: 'Constrained JSON or schema-valid output.' },
  { slug: 'reasoning', name: 'Reasoning', description: 'Extended chain-of-thought / thinking mode.' },
  { slug: 'audio-input', name: 'Audio input', description: 'Accepts audio input.' },
  { slug: 'prompt-caching', name: 'Prompt caching', description: 'Discounted pricing for cached prompt prefixes.' },
  { slug: 'fine-tuning', name: 'Fine-tuning', description: 'Supports custom fine-tuning.' },
];

export const benchmarks = [
  { slug: 'mmlu', name: 'MMLU', category: 'knowledge', unit: '%', higherIsBetter: true, maxScore: 100, description: 'Massive Multitask Language Understanding: 57-subject multiple choice.' },
  { slug: 'gpqa-diamond', name: 'GPQA Diamond', category: 'reasoning', unit: '%', higherIsBetter: true, maxScore: 100, description: 'Graduate-level Google-proof science questions.' },
  { slug: 'humaneval', name: 'HumanEval', category: 'coding', unit: '%', higherIsBetter: true, maxScore: 100, description: 'Python function synthesis (pass@1).' },
  { slug: 'swe-bench-verified', name: 'SWE-bench Verified', category: 'coding', unit: '%', higherIsBetter: true, maxScore: 100, description: 'Resolving real GitHub issues in repositories.' },
  { slug: 'math-500', name: 'MATH-500', category: 'math', unit: '%', higherIsBetter: true, maxScore: 100, description: 'Competition mathematics problems.' },
  { slug: 'ifeval', name: 'IFEval', category: 'instruction-following', unit: '%', higherIsBetter: true, maxScore: 100, description: 'Verifiable instruction-following accuracy.' },
];

/** order of positional scores in each model entry below */
export const SCORE_ORDER = ['mmlu', 'gpqa-diamond', 'humaneval', 'math-500', 'swe-bench-verified', 'ifeval'] as const;

type Score = number | null;
export interface SeedModel {
  slug: string; name: string; lab: string; type: ModelType; contextWindow: number; maxOutputTokens: number | null;
  releaseDate: string; inputModalities: Modality[]; outputModalities: Modality[]; isOpenSource: boolean;
  parameterCount: string | null; capabilities: string[]; description: string;
  providers: { provider: string; input: number; output: number; throughputTps?: number; latencyMs?: number }[];
  scores: Score[];
}

const m = (
  slug: string, name: string, lab: string, type: ModelType, ctx: number, maxOut: number | null, release: string,
  inMods: Modality[], outMods: Modality[], oss: boolean, params: string | null, caps: string[],
  provs: [string, number, number][], scores: Score[], description: string,
): SeedModel => ({
  slug, name, lab, type, contextWindow: ctx, maxOutputTokens: maxOut, releaseDate: release,
  inputModalities: inMods, outputModalities: outMods, isOpenSource: oss, parameterCount: params, capabilities: caps,
  providers: provs.map(([provider, input, output]) => ({ provider, input, output })), scores, description,
});

const LLM = ModelType.LLM, MM = ModelType.MULTIMODAL, EMB = ModelType.EMBEDDING;
const TOOLS = ['tool-calling', 'json-mode'];

// score order: [mmlu, gpqa, humaneval, math500, swe, ifeval]
export const models: SeedModel[] = [
  m('gpt-4o', 'GPT-4o', 'openai', MM, 128000, 16384, '2024-05-13', [T, I, A], [T], false, null, ['tool-calling', 'vision', 'json-mode', 'audio-input', 'prompt-caching', 'fine-tuning'], [['openai-api', 2.5, 10], ['azure-openai', 2.5, 10]], [88.7, 53.6, 90.2, 76.6, null, null], 'OpenAI flagship multimodal model balancing quality and speed.'),
  m('gpt-4o-mini', 'GPT-4o mini', 'openai', MM, 128000, 16384, '2024-07-18', [T, I], [T], false, null, ['tool-calling', 'vision', 'json-mode', 'prompt-caching', 'fine-tuning'], [['openai-api', 0.15, 0.6], ['azure-openai', 0.15, 0.6]], [82.0, 40.2, 87.2, 70.2, null, null], 'Small, very low-cost multimodal model.'),
  m('gpt-4-1', 'GPT-4.1', 'openai', MM, 1047576, 32768, '2025-04-14', [T, I], [T], false, null, ['tool-calling', 'vision', 'json-mode', 'prompt-caching', 'fine-tuning'], [['openai-api', 2, 8], ['azure-openai', 2, 8]], [90.2, 66.3, null, null, 54.6, 87.4], 'Long-context coding-focused model with 1M token window.'),
  m('o3', 'o3', 'openai', MM, 200000, 100000, '2025-04-16', [T, I], [T], false, null, ['tool-calling', 'vision', 'json-mode', 'reasoning', 'prompt-caching'], [['openai-api', 2, 8], ['azure-openai', 2, 8]], [null, 83.3, null, null, 69.1, null], 'OpenAI reasoning model for complex multi-step problems.'),
  m('o4-mini', 'o4-mini', 'openai', MM, 200000, 100000, '2025-04-16', [T, I], [T], false, null, ['tool-calling', 'vision', 'json-mode', 'reasoning', 'prompt-caching'], [['openai-api', 1.1, 4.4], ['azure-openai', 1.1, 4.4]], [null, 81.4, null, null, 68.1, null], 'Fast, cost-efficient reasoning model.'),
  m('claude-3-5-sonnet', 'Claude 3.5 Sonnet', 'anthropic', MM, 200000, 8192, '2024-10-22', [T, I, F], [T], false, null, ['tool-calling', 'vision', 'json-mode', 'prompt-caching'], [['anthropic-api', 3, 15], ['aws-bedrock', 3, 15], ['google-vertex', 3, 15]], [88.7, 65.0, 93.7, 78.3, 49.0, 90.2], 'Strong all-round model with industry-leading coding at release.'),
  m('claude-3-5-haiku', 'Claude 3.5 Haiku', 'anthropic', LLM, 200000, 8192, '2024-11-04', [T, I], [T], false, null, ['tool-calling', 'json-mode', 'prompt-caching'], [['anthropic-api', 0.8, 4], ['aws-bedrock', 0.8, 4], ['google-vertex', 0.8, 4]], [80.9, 41.6, 88.1, 69.4, 40.6, null], 'Fast and affordable Claude model.'),
  m('claude-3-7-sonnet', 'Claude 3.7 Sonnet', 'anthropic', MM, 200000, 64000, '2025-02-24', [T, I, F], [T], false, null, ['tool-calling', 'vision', 'json-mode', 'reasoning', 'prompt-caching'], [['anthropic-api', 3, 15], ['aws-bedrock', 3, 15], ['google-vertex', 3, 15]], [null, 68.0, null, 82.2, 62.3, 90.8], 'First hybrid reasoning Claude model with extended thinking.'),
  m('claude-sonnet-4', 'Claude Sonnet 4', 'anthropic', MM, 200000, 64000, '2025-05-22', [T, I, F], [T], false, null, ['tool-calling', 'vision', 'json-mode', 'reasoning', 'prompt-caching'], [['anthropic-api', 3, 15], ['aws-bedrock', 3, 15], ['google-vertex', 3, 15]], [null, 75.4, null, null, 72.7, null], 'Balanced Claude 4 model with strong agentic coding.'),
  m('claude-opus-4', 'Claude Opus 4', 'anthropic', MM, 200000, 32000, '2025-05-22', [T, I, F], [T], false, null, ['tool-calling', 'vision', 'json-mode', 'reasoning', 'prompt-caching'], [['anthropic-api', 15, 75], ['aws-bedrock', 15, 75], ['google-vertex', 15, 75]], [null, 79.6, null, null, 72.5, null], 'Most capable Claude 4 model for long-running agentic work.'),
  m('gemini-2-0-flash', 'Gemini 2.0 Flash', 'google-deepmind', MM, 1048576, 8192, '2025-02-05', [T, I, A, V], [T], false, null, ['tool-calling', 'vision', 'json-mode', 'audio-input', 'prompt-caching'], [['google-vertex', 0.1, 0.4]], [null, 62.1, null, 90.9, null, null], 'Fast multimodal model with a 1M-token context.'),
  m('gemini-2-5-flash', 'Gemini 2.5 Flash', 'google-deepmind', MM, 1048576, 65536, '2025-04-17', [T, I, A, V], [T], false, null, ['tool-calling', 'vision', 'json-mode', 'reasoning', 'audio-input', 'prompt-caching'], [['google-vertex', 0.3, 2.5]], [null, 78.3, null, null, null, null], 'Price-performance thinking model.'),
  m('gemini-2-5-pro', 'Gemini 2.5 Pro', 'google-deepmind', MM, 1048576, 65536, '2025-03-25', [T, I, A, V], [T], false, null, ['tool-calling', 'vision', 'json-mode', 'reasoning', 'audio-input', 'prompt-caching'], [['google-vertex', 1.25, 10]], [null, 84.0, null, null, 63.8, null], 'Google most capable reasoning model with 1M context.'),
  m('llama-3-1-405b', 'Llama 3.1 405B Instruct', 'meta', LLM, 131072, 4096, '2024-07-23', [T], [T], true, '405B', TOOLS, [['together', 3.5, 3.5], ['fireworks', 3, 3], ['deepinfra', 0.8, 0.8]], [88.6, 50.7, 89.0, 73.8, null, 88.6], 'Largest open-weights model of the Llama 3.1 generation.'),
  m('llama-3-1-70b', 'Llama 3.1 70B Instruct', 'meta', LLM, 131072, 4096, '2024-07-23', [T], [T], true, '70B', TOOLS, [['together', 0.88, 0.88], ['groq', 0.59, 0.79], ['deepinfra', 0.23, 0.4]], [86.0, 41.7, 80.5, 68.0, null, 87.5], 'Open-weights mid-size Llama 3.1.'),
  m('llama-3-1-8b', 'Llama 3.1 8B Instruct', 'meta', LLM, 131072, 4096, '2024-07-23', [T], [T], true, '8B', TOOLS, [['together', 0.18, 0.18], ['groq', 0.05, 0.08], ['deepinfra', 0.03, 0.05]], [73.0, 32.8, 72.6, 51.9, null, 80.4], 'Small open-weights model suited to edge and high-volume use.'),
  m('llama-3-3-70b', 'Llama 3.3 70B Instruct', 'meta', LLM, 131072, 4096, '2024-12-06', [T], [T], true, '70B', TOOLS, [['groq', 0.59, 0.79], ['together', 0.88, 0.88], ['fireworks', 0.9, 0.9], ['deepinfra', 0.23, 0.4]], [86.0, 50.5, 88.4, 77.0, null, 92.1], '70B model matching much larger Llama quality.'),
  m('llama-4-maverick', 'Llama 4 Maverick', 'meta', MM, 1048576, null, '2025-04-05', [T, I], [T], true, '400B (17B active)', ['tool-calling', 'vision', 'json-mode'], [['groq', 0.2, 0.6], ['together', 0.27, 0.85], ['fireworks', 0.22, 0.88], ['deepinfra', 0.15, 0.6]], [null, 69.8, null, null, null, null], 'Mixture-of-experts multimodal open-weights model.'),
  m('llama-4-scout', 'Llama 4 Scout', 'meta', MM, 10000000, null, '2025-04-05', [T, I], [T], true, '109B (17B active)', ['tool-calling', 'vision', 'json-mode'], [['groq', 0.11, 0.34], ['together', 0.18, 0.59], ['deepinfra', 0.08, 0.3]], [null, 57.2, null, null, null, null], 'Open-weights MoE model with a 10M-token context window.'),
  m('mistral-large-2', 'Mistral Large 2', 'mistral', LLM, 128000, null, '2024-07-24', [T], [T], false, '123B', TOOLS, [['mistral-platform', 2, 6], ['aws-bedrock', 2, 6], ['google-vertex', 2, 6], ['azure-openai', 3, 9]], [84.0, null, 92.0, 69.9, null, null], 'Mistral flagship with strong code and multilingual ability.'),
  m('mistral-small-3', 'Mistral Small 3', 'mistral', LLM, 32768, null, '2025-01-30', [T], [T], true, '24B', TOOLS, [['mistral-platform', 0.1, 0.3], ['together', 0.8, 0.8], ['deepinfra', 0.07, 0.14]], [81.0, 45.3, 84.8, 70.6, null, 82.9], 'Latency-optimised 24B open model under Apache 2.0.'),
  m('codestral', 'Codestral', 'mistral', LLM, 256000, null, '2025-01-13', [T], [T], false, '22B', TOOLS, [['mistral-platform', 0.3, 0.9]], [null, null, 86.6, null, null, null], 'Code-specialised model for completion and FIM.'),
  m('mixtral-8x22b', 'Mixtral 8x22B Instruct', 'mistral', LLM, 65536, null, '2024-04-17', [T], [T], true, '141B (39B active)', TOOLS, [['together', 1.2, 1.2], ['mistral-platform', 2, 6]], [77.8, null, 75.0, 41.0, null, null], 'Sparse MoE open-weights model.'),
  m('deepseek-v3', 'DeepSeek V3', 'deepseek', LLM, 131072, 8192, '2024-12-26', [T], [T], true, '671B (37B active)', ['tool-calling', 'json-mode', 'prompt-caching'], [['deepseek-api', 0.27, 1.1], ['together', 1.25, 1.25], ['fireworks', 0.9, 0.9], ['deepinfra', 0.38, 0.89]], [88.5, 59.1, 82.6, 90.2, 42.0, 86.1], 'Efficient MoE chat model competitive with frontier closed models.'),
  m('deepseek-r1', 'DeepSeek R1', 'deepseek', LLM, 131072, 32768, '2025-01-20', [T], [T], true, '671B (37B active)', ['reasoning', 'json-mode'], [['deepseek-api', 0.55, 2.19], ['together', 3, 7], ['fireworks', 3, 8], ['deepinfra', 0.7, 2.4]], [90.8, 71.5, null, 97.3, 49.2, 83.3], 'Open-weights reasoning model trained with reinforcement learning.'),
  m('qwen-2-5-72b', 'Qwen2.5 72B Instruct', 'alibaba-qwen', LLM, 131072, 8192, '2024-09-19', [T], [T], true, '72B', TOOLS, [['together', 1.2, 1.2], ['deepinfra', 0.12, 0.39]], [86.1, 49.0, 86.6, 83.1, null, 84.1], 'Strong open multilingual model.'),
  m('qwen3-235b-a22b', 'Qwen3 235B A22B', 'alibaba-qwen', LLM, 131072, 32768, '2025-04-29', [T], [T], true, '235B (22B active)', ['tool-calling', 'json-mode', 'reasoning'], [['together', 0.2, 0.6], ['fireworks', 0.22, 0.88], ['deepinfra', 0.13, 0.6]], [null, 71.1, null, null, null, null], 'Hybrid thinking MoE open-weights model.'),
  m('grok-3', 'Grok 3', 'xai', LLM, 131072, null, '2025-02-17', [T, I], [T], false, null, ['tool-calling', 'vision', 'json-mode'], [['xai-api', 3, 15]], [null, 75.4, null, null, null, null], 'xAI flagship model.'),
  m('grok-3-mini', 'Grok 3 Mini', 'xai', LLM, 131072, null, '2025-02-17', [T], [T], false, null, ['tool-calling', 'json-mode', 'reasoning'], [['xai-api', 0.3, 0.5]], [null, 66.2, null, null, null, null], 'Lightweight reasoning model.'),
  m('command-r-plus', 'Command R+', 'cohere', LLM, 128000, 4096, '2024-08-30', [T], [T], false, '104B', ['tool-calling', 'json-mode', 'fine-tuning'], [['cohere-api', 2.5, 10], ['aws-bedrock', 3, 15], ['azure-openai', 2.5, 10]], [75.7, null, null, null, null, null], 'RAG-optimised enterprise model.'),
  m('command-a', 'Command A', 'cohere', LLM, 256000, 8192, '2025-03-13', [T], [T], false, '111B', ['tool-calling', 'json-mode'], [['cohere-api', 2.5, 10]], [85.5, null, 90.0, 80.0, null, 90.9], 'Agentic enterprise model with 256k context.'),
  m('phi-4', 'Phi-4', 'microsoft', LLM, 16384, null, '2024-12-12', [T], [T], true, '14B', ['json-mode'], [['azure-openai', 0.1, 0.5], ['deepinfra', 0.07, 0.14]], [84.8, 56.1, 82.6, 80.4, null, 63.0], 'Small model with strong reasoning for its size.'),
  m('llama-3-1-nemotron-70b', 'Llama 3.1 Nemotron 70B', 'nvidia', LLM, 131072, 4096, '2024-10-15', [T], [T], true, '70B', ['tool-calling'], [['deepinfra', 0.12, 0.3], ['together', 0.88, 0.88]], [null, null, null, null, null, null], 'Llama 3.1 70B tuned by NVIDIA for helpfulness.'),
  m('kimi-k2', 'Kimi K2', 'moonshot-ai', LLM, 131072, null, '2025-07-11', [T], [T], true, '1T (32B active)', ['tool-calling', 'json-mode'], [['moonshot-api', 0.6, 2.5], ['together', 1, 3], ['fireworks', 0.6, 2.5]], [89.5, 75.1, 93.3, 97.4, 65.8, 89.8], 'Trillion-parameter MoE tuned for agentic tasks.'),
  m('glm-4-5', 'GLM-4.5', 'zhipu-ai', LLM, 131072, 96000, '2025-07-28', [T], [T], true, '355B (32B active)', ['tool-calling', 'json-mode', 'reasoning'], [['zhipu-api', 0.6, 2.2], ['together', 0.6, 2.2]], [null, 79.1, null, 98.2, 64.2, null], 'Open-weights agentic and reasoning MoE model.'),
  m('nova-pro', 'Amazon Nova Pro', 'amazon', MM, 300000, 5120, '2024-12-03', [T, I, V], [T], false, null, ['tool-calling', 'vision', 'json-mode'], [['aws-bedrock', 0.8, 3.2]], [85.9, 46.9, 89.0, 76.6, null, 92.1], 'Capable multimodal model on Bedrock.'),
  m('nova-lite', 'Amazon Nova Lite', 'amazon', MM, 300000, 5120, '2024-12-03', [T, I, V], [T], false, null, ['tool-calling', 'vision', 'json-mode'], [['aws-bedrock', 0.06, 0.24]], [80.5, 42.0, 85.4, 73.3, null, 89.7], 'Very low-cost multimodal model.'),
  m('jamba-1-5-large', 'Jamba 1.5 Large', 'ai21-labs', LLM, 256000, 4096, '2024-08-22', [T], [T], true, '398B (94B active)', TOOLS, [['aws-bedrock', 2, 8], ['google-vertex', 2, 8]], [81.2, 36.9, null, null, null, null], 'Hybrid SSM-Transformer long-context model.'),
  m('text-embedding-3-large', 'text-embedding-3-large', 'openai', EMB, 8191, null, '2024-01-25', [T], [T], false, null, [], [['openai-api', 0.13, 0], ['azure-openai', 0.13, 0]], [], 'High-accuracy text embedding model (3072 dims).'),
  m('embed-english-v3', 'Embed English v3', 'cohere', EMB, 512, null, '2023-11-02', [T], [T], false, null, [], [['cohere-api', 0.1, 0]], [], 'English text embedding model.'),
];
