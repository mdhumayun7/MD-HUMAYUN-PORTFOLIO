// ===========================================================================
//  PROJECTS — the centrepiece of the site.
//
//  TO ADD A PROJECT: copy any object below, change the values, and add it
//  to the array. Nothing else in the codebase needs to change.
//
//  FIELD REFERENCE
//  ---------------------------------------------------------------------
//  id            required  unique slug. Used for the URL anchor (#id).
//  title         required
//  tagline       required  one line, aim for under 90 characters
//  discipline    required  'ML' | 'Systems' | 'Security' | 'Automation'
//  period        required  e.g. 'Aug 2025 - Jan 2026'
//  tech          required  array of strings; also feeds the tech filter
//  problem       required  what needed solving, 2-3 sentences
//  contribution  required  what YOU specifically did
//  featured      optional  true = renders first, at larger size
//  secondary     optional  true = renders in the compact 'Earlier work' list
//                          at the bottom, without diagrams or deep dives
//  status        optional  'shipped' | 'research' | 'archived'
//  metrics       optional  [{ label, value }] -- omit rather than pad
//  deepDive      optional  [{ heading, body }] -- collapsed by default
//  links         optional  { repo, demo, paper, video } -- any subset
//  simulationId  optional  must match a key in components/simulations/registry.js
//  diagrams      optional  { arch, flow } -- see the shape notes below
//
//  DIAGRAM SHAPES (rendered as SVG, no image files, themes automatically)
//  ---------------------------------------------------------------------
//  arch: {
//    caption: 'string shown under the figure',
//    lanes: [ { title: 'Column heading', nodes: [ { id, label, note? } ] } ],
//    links: [ { from: 'nodeId', to: 'nodeId', label? } ]
//  }
//  flow: {
//    caption: 'string',
//    steps: [ { id, label, detail? } ],
//    loop?: { from: 'nodeId', to: 'nodeId', label: 'string' }
//  }
// ===========================================================================

export const projects = [
  // -------------------------------------------------------------------
  {
    id: 'drone-swarm',
    title: 'Hybrid AI-Based Autonomous Drone Swarm Navigation',
    tagline:
      'A multi-agent simulator and seven competing commander architectures, benchmarked head to head.',
    discipline: 'ML',
    period: 'May 2026 - Jul 2026',
    featured: true,
    status: 'research',
    tech: ['Python', 'Blender', 'LLMs (Groq)', 'LoRA', 'PPO', 'Gymnasium'],
    problem:
      'Coordinating a drone swarm means choosing a commander: a policy that turns a shared view of the world into per-agent actions. Classical approaches like consensus and potential fields are predictable but rigid, while learned policies are flexible and hard to trust. Nobody had compared them on the same footing, because there was no common environment to compare them in.',
    contribution:
      'I built the environment that made the comparison possible, then ran it. That meant generating synthetic urban scenarios in Blender, auto-labelling them through an LLM annotation stage, and designing BattleWorld: a multi-agent simulator wrapped as a Gymnasium environment exposing a uniform 12-dimensional state interface, so every decision module — classical or learned — consumed identical input. I then fine-tuned an LLM with LoRA on the generated tactical labels and benchmarked seven commander architectures across 28 held-out scenarios. Team project of two, guided by Prof. Mukesh A. Zaveri.',
    metrics: [
      { label: 'Hybrid LLM+PPO accuracy', value: '67.9%' },
      { label: 'Best classical baseline', value: '60.7%' },
      { label: 'LoRA mean token accuracy', value: '91.2%' },
      { label: 'Training loss', value: '0.463' },
    ],
    simulationId: 'swarm-commander',
    deepDive: [
      {
        heading: 'Why a uniform 12-dimensional state interface',
        body: 'Benchmarks between control strategies usually fail because each strategy quietly gets a different view of the world, and the comparison measures the input rather than the policy. Fixing the state vector at 12 dimensions across every module — consensus, potential field, PSO, the LLM, PPO, and the hybrid — meant any difference in the results came from the decision logic itself.',
      },
      {
        heading: 'The scenario pipeline',
        body: 'Urban scenarios are generated procedurally in Blender rather than hand-authored, which makes the scenario count a parameter instead of a bottleneck. Each generated scene passes through an LLM annotation stage that assigns tactical labels, producing the supervised signal used for the LoRA fine-tune.',
      },
      {
        heading: 'What the benchmark showed',
        body: 'Across 28 held-out scenarios, the hybrid LLM+PPO commander reached 67.9% action accuracy against 60.7% for the strongest classical baseline. The hybrid does not dominate everywhere, which is the more useful finding: the classical controllers remain competitive in constrained scenarios where the action space is narrow.',
      },
    ],
    links: {
      video: 'https://drive.google.com/file/d/1zHO33qPGtrWtDfhehBWT-QbK_ZDj5pvY/view?usp=sharing',
    },
    diagrams: {
      arch: {
        caption:
          'Scenario generation feeds both the fine-tuning corpus and the simulator; every commander reads the same 12-dimensional state.',
        lanes: [
          {
            title: 'Scenario generation',
            nodes: [
              { id: 'blender', label: 'Blender', note: 'synthetic urban scenes' },
              { id: 'annot', label: 'LLM annotation', note: 'tactical labels' },
            ],
          },
          {
            title: 'Environment',
            nodes: [
              { id: 'bw', label: 'BattleWorld', note: 'Gymnasium env' },
              { id: 'state', label: '12-D state', note: 'shared interface' },
            ],
          },
          {
            title: 'Commanders',
            nodes: [
              { id: 'classical', label: 'Classical', note: 'consensus, PSO, field' },
              { id: 'llm', label: 'LoRA LLM', note: 'fine-tuned' },
              { id: 'ppo', label: 'PPO', note: 'RL policy' },
              { id: 'hybrid', label: 'Hybrid', note: 'LLM + PPO' },
            ],
          },
          {
            title: 'Evaluation',
            nodes: [{ id: 'bench', label: 'Benchmark', note: '28 scenarios' }],
          },
        ],
        links: [
          { from: 'blender', to: 'annot' },
          { from: 'annot', to: 'bw' },
          { from: 'bw', to: 'state' },
          { from: 'state', to: 'classical' },
          { from: 'state', to: 'llm' },
          { from: 'state', to: 'ppo' },
          { from: 'state', to: 'hybrid' },
          { from: 'hybrid', to: 'bench' },
        ],
      },
      flow: {
        caption: 'One benchmark run, end to end.',
        steps: [
          { id: 'gen', label: 'Generate scene', detail: 'Blender, procedural' },
          { id: 'label', label: 'Annotate', detail: 'LLM tactical labels' },
          { id: 'tune', label: 'Fine-tune', detail: 'LoRA on labels' },
          { id: 'sim', label: 'Simulate', detail: 'BattleWorld rollout' },
          { id: 'score', label: 'Score', detail: 'action accuracy' },
        ],
      },
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'vipergpt',
    title: 'Spatial Mental Modeling from Limited Views',
    tagline:
      'Reproducing and extending ViperGPT, then finding out that a no-program baseline beats it on two benchmarks.',
    discipline: 'ML',
    period: '2025 - 2026',
    status: 'research',
    tech: [
      'Python',
      'ViperGPT',
      'GLIP',
      'Qwen2.5-Coder',
      'DeepSeek-Coder-V2-Lite',
      'SLURM',
    ],
    problem:
      'ViperGPT (Suris et al., ICCV 2023) answers a visual question by having a language model write a short Python program against a fixed API of vision primitives, then executing it. That is an appealing idea for spatial reasoning specifically, because the program is inspectable -- but it depends entirely on two things nobody had stress-tested together: whether the prompt actually specifies the API precisely enough for a smaller open model to use it correctly, and whether generating a program helps at all once you compare it honestly against just answering directly.',
    contribution:
      'I reproduced ViperGPT end to end on the SVNIT HPC cluster (H100 NVL GPUs via SLURM) and ran a four-condition prompt study, C1 through C4, which surfaced a specification gap that did not shrink as models got bigger -- larger models still misused the API the same way smaller ones did unless the prompt closed the gap directly. I extended the API with depth-grounded primitives (depth_order, is_behind) grounded in monocular depth estimates, which measurably improved accuracy on depth-dependent queries. I then ran a generalisation sweep across four open code models (Qwen2.5-Coder, DeepSeek-Coder-V2-Lite, Yi-Coder-9B, OpenCoder-8B) across conditions and two datasets, RefCOCO and RefCOCO+, adding a fifth condition, C5, that asks the generator for descriptive phrases instead of bare nouns. Compiling GLIP for the H100\'s sm_90 architecture, which required patching removed THC headers and correcting build flags, was its own piece of infrastructure work underneath all of this.',
    metrics: [
      { label: 'Prompt conditions tested', value: 'C1 - C5' },
      { label: 'Generator models compared', value: '4' },
      { label: 'Datasets', value: 'RefCOCO, RefCOCO+' },
      { label: 'Write-up', value: '56 pages' },
    ],
    deepDive: [
      {
        heading: 'The finding I did not expect to publish',
        body: 'I built a no-program baseline, B0, that skips code generation entirely and just runs find() on the full query. It outperformed every generated-program condition on both RefCOCO and RefCOCO+. That is not a flattering result for the approach I spent the most time extending, but it is the most useful one in the repository: it means the value ViperGPT\'s program-synthesis step adds is not yet established on these benchmarks, and any claim about the depth-grounded primitives has to be read against that baseline, not against zero.',
      },
      {
        heading: 'A gap that scale did not close',
        body: 'The C1-C4 study varied how explicitly the prompt specified the API. The resulting errors looked the same shape across model sizes -- this was a specification problem, not a capacity problem, which is why C5 targeted the prompt itself (descriptive phrases instead of bare nouns into find()) rather than trying a bigger model. C5\'s effect still depended on which generator was running it: a real gain for Qwen and DeepSeek, a slight loss for Yi.',
      },
      {
        heading: 'Depth grounding, and why it needed its own sign check',
        body: 'The depth-order and is_behind primitives are only as good as the depth map underneath them, and monocular depth estimators are not universally oriented the same way. Verifying the actual sign convention of the estimator in use, rather than assuming it matched the paper\'s, was a one-line fix that would otherwise have silently inverted every depth comparison.',
      },
      {
        heading: 'Infrastructure most reviewers will not see',
        body: 'Two separate conda environments (one for ViperGPT, one for GLIP) split at a fixed programs.jsonl boundary, GLIP recompiled for sm_90 with corrected tensor input handling, and the retired Codex generator replaced with Qwen2.5-Coder -- none of this appears in a results table, all of it was necessary before one existed.',
      },
    ],
    diagrams: {
      arch: {
        caption:
          'A generated program calls into an extended primitive set; the no-program baseline bypasses generation entirely and is evaluated on the same input.',
        lanes: [
          {
            title: 'Input',
            nodes: [
              { id: 'img', label: 'Image + query' },
            ],
          },
          {
            title: 'Program path',
            nodes: [
              { id: 'gen', label: 'Code generator', note: 'Qwen2.5-Coder et al.' },
              { id: 'prog', label: 'Generated program' },
            ],
          },
          {
            title: 'Execution',
            nodes: [
              { id: 'api', label: 'ViperGPT API', note: '+ depth_order, is_behind' },
              { id: 'glip', label: 'GLIP', note: 'grounding, sm_90' },
            ],
          },
          {
            title: 'Baseline',
            nodes: [
              { id: 'b0', label: 'B0: find(query)[0]', note: 'no program' },
            ],
          },
        ],
        links: [
          { from: 'img', to: 'gen' },
          { from: 'gen', to: 'prog' },
          { from: 'prog', to: 'api' },
          { from: 'api', to: 'glip' },
          { from: 'img', to: 'b0' },
        ],
      },
      flow: {
        caption: 'One condition of the generalisation sweep: every model and dataset combination run against both paths.',
        steps: [
          { id: 'prompt', label: 'Prompt variant', detail: 'C1 - C5' },
          { id: 'model', label: 'Generator', detail: '4 models' },
          { id: 'run', label: 'Execute', detail: 'program or B0' },
          { id: 'score', label: 'Score', detail: 'RefCOCO / RefCOCO+' },
        ],
      },
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'ddos-sdn',
    title: 'DDoS Detection & Mitigation on an SDN Controller',
    tagline:
      'A software-defined network that identifies flooding hosts and drops their traffic without human intervention.',
    discipline: 'Security',
    period: 'Aug 2025 - Jan 2026',
    featured: true,
    status: 'shipped',
    tech: ['Python', 'Mininet', 'POX', 'OpenFlow', 'Random Forest', 'Scapy', 'scikit-learn'],
    problem:
      'A flooding attack on a network is easy to describe and hard to catch early: by the time throughput has visibly collapsed, the damage is done. Fixed-threshold rules catch obvious floods but misfire on legitimate traffic spikes, and they cannot adapt as attack patterns change.',
    contribution:
      'I built the whole loop rather than just the classifier. I simulated a distributed denial-of-service attack against a virtual network, implemented detection inside an SDN controller that tracks per-host traffic rate and blocks hosts crossing a safe limit via OpenFlow, then replaced the fixed threshold with a Random Forest trained on traffic features to separate normal from attack flows. I measured the impact with iperf and ping rather than asserting it.',
    metrics: [
      { label: 'Throughput under attack', value: '54.3 -> 31 Gbps' },
      { label: 'Latency increase', value: 'over 10x' },
    ],
    deepDive: [
      {
        heading: 'Why measure, not assert',
        body: 'Security projects tend to end at "it detects the attack". Running iperf and ping across the topology before and during the flood turns the claim into a number: throughput falls from 54.3 to 31 Gbps and latency rises by more than an order of magnitude. Those numbers are also what make the mitigation provable, because you can watch them recover.',
      },
      {
        heading: 'From threshold to classifier',
        body: 'The threshold monitor is the honest baseline: cheap, interpretable, and wrong whenever legitimate traffic spikes. Training a Random Forest with scikit-learn and pandas on features drawn from the SDN environment separates normal from attack traffic on learned structure instead of a single hand-picked number, which is what lets the same detector generalise past the exact flood it was tuned on.',
      },
      {
        heading: 'Mitigation inside the control plane',
        body: 'Because detection runs on the controller, mitigation is a control-plane action rather than an external appliance: the controller installs an OpenFlow DROP rule against the offending host, and the switch enforces it at line rate.',
      },
    ],
    links: { repo: 'https://github.com/mdhumayun7/ddos-5g-sdn-project' },
    simulationId: 'ddos-pipeline',
    diagrams: {
      arch: {
        caption:
          'Detection lives on the controller, so mitigation is a control-plane action rather than an external appliance.',
        lanes: [
          {
            title: 'Data plane',
            nodes: [
              { id: 'hosts', label: 'Hosts', note: 'normal + attacker' },
              { id: 'switch', label: 'OpenFlow switch', note: 'Mininet' },
            ],
          },
          {
            title: 'Control plane',
            nodes: [
              { id: 'pox', label: 'POX controller' },
              { id: 'monitor', label: 'Rate monitor', note: 'per-host counters' },
            ],
          },
          {
            title: 'Detection',
            nodes: [
              { id: 'feat', label: 'Feature extraction' },
              { id: 'rf', label: 'Random Forest', note: 'normal vs attack' },
            ],
          },
          {
            title: 'Response',
            nodes: [{ id: 'drop', label: 'DROP rule', note: 'installed via OpenFlow' }],
          },
        ],
        links: [
          { from: 'hosts', to: 'switch' },
          { from: 'switch', to: 'pox' },
          { from: 'pox', to: 'monitor' },
          { from: 'monitor', to: 'feat' },
          { from: 'feat', to: 'rf' },
          { from: 'rf', to: 'drop' },
          { from: 'drop', to: 'switch', label: 'enforced' },
        ],
      },
      flow: {
        caption: 'The closed loop: traffic is observed, classified, and acted on continuously.',
        steps: [
          { id: 'traffic', label: 'Traffic', detail: 'ICMP flood via Scapy' },
          { id: 'observe', label: 'Observe', detail: 'per-host packet rate' },
          { id: 'classify', label: 'Classify', detail: 'Random Forest' },
          { id: 'mitigate', label: 'Mitigate', detail: 'install DROP rule' },
          { id: 'verify', label: 'Verify', detail: 'iperf + ping' },
        ],
        loop: { from: 'verify', to: 'observe', label: 'continuous' },
      },
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'vae-latent-space',
    title: 'Latent Space Analysis with Variational Autoencoders',
    tagline:
      'Reproducing Kingma & Welling, then pushing it to faces until it broke — and finding out why.',
    discipline: 'ML',
    period: 'Feb 2026 - Apr 2026',
    featured: true,
    status: 'shipped',
    tech: ['Python', 'TensorFlow', 'Keras', 'OpenCV', 'NumPy', 'scikit-learn'],
    problem:
      'Auto-Encoding Variational Bayes is one of the foundational generative modelling papers, and reproducing it faithfully is a different exercise from importing a library implementation. The harder question is what happens when you scale the same idea past MNIST to real photographs, where the model has far more room to fail quietly.',
    contribution:
      'I implemented the encoder, decoder, reparameterisation trick and ELBO from the paper in TensorFlow, then extended the architecture twice: a Conditional VAE for class-controlled generation, and convolutional encoders and decoders replacing the dense layers for 128x128 RGB faces. When the face model showed posterior collapse I traced it to a mis-scaled KL term and verified the recovery through latent mean and variance diagnostics rather than by eyeballing samples. Guided by Prof. Mukesh A. Zaveri.',
    metrics: [
      { label: 'SSIM', value: '0.678' },
      { label: 'PSNR', value: '23.40 dB' },
      { label: 'MNIST digits', value: '60,000' },
      { label: 'LFW faces', value: '13,233' },
    ],
    deepDive: [
      {
        heading: 'Diagnosing posterior collapse',
        body: 'On face data the model began ignoring its latent code entirely — reconstructions stayed plausible while the latent variables stopped carrying information. The cause was a mis-scaled KL term overwhelming the reconstruction objective. What made the fix verifiable was checking latent mean and variance statistics directly, rather than judging recovery from generated samples, which look acceptable long before the latent space is actually healthy.',
      },
      {
        heading: 'Four models, one evaluation',
        body: 'The vanilla VAE, the Conditional VAE, and the convolutional face models were all evaluated on held-out data under the same protocol, reaching 0.678 SSIM and 23.40 dB PSNR. Evaluating generative models is notoriously slippery, so pinning to reconstruction metrics on held-out data keeps the comparison honest even though it does not capture sample diversity.',
      },
      {
        heading: 'Why conditioning matters',
        body: 'A plain VAE gives you a latent space you can sample from but not steer. Adding class conditioning turns generation into something controllable, which is the difference between an interesting artefact and a component you could actually put in a pipeline.',
      },
    ],
    links: {
      repo: 'https://github.com/mdhumayun7/vae-aevb-reimplementation',
      demo: 'https://github.com/mdhumayun7/CVAE-MNIST-DEPLOY',
    },
    simulationId: 'latent-space',
    diagrams: {
      arch: {
        caption:
          'The same probabilistic core, with the encoder and decoder swapped from dense layers to convolutions for face data.',
        lanes: [
          {
            title: 'Input',
            nodes: [
              { id: 'x', label: 'x', note: 'image' },
              { id: 'y', label: 'class label', note: 'CVAE only' },
            ],
          },
          {
            title: 'Encoder',
            nodes: [
              { id: 'enc', label: 'Encoder', note: 'dense or conv' },
              { id: 'params', label: 'mu, sigma' },
            ],
          },
          {
            title: 'Latent',
            nodes: [
              { id: 'repar', label: 'Reparameterise', note: 'z = mu + sigma * eps' },
              { id: 'z', label: 'z', note: 'latent code' },
            ],
          },
          {
            title: 'Decoder',
            nodes: [
              { id: 'dec', label: 'Decoder' },
              { id: 'xhat', label: 'reconstruction' },
            ],
          },
        ],
        links: [
          { from: 'x', to: 'enc' },
          { from: 'y', to: 'enc' },
          { from: 'enc', to: 'params' },
          { from: 'params', to: 'repar' },
          { from: 'repar', to: 'z' },
          { from: 'z', to: 'dec' },
          { from: 'dec', to: 'xhat' },
        ],
      },
      flow: {
        caption: 'Training step: two losses, one gradient path made possible by the reparameterisation trick.',
        steps: [
          { id: 'batch', label: 'Batch', detail: 'MNIST or LFW' },
          { id: 'encode', label: 'Encode', detail: 'to mu, sigma' },
          { id: 'sample', label: 'Sample z', detail: 'reparameterised' },
          { id: 'decode', label: 'Decode', detail: 'reconstruct' },
          { id: 'elbo', label: 'ELBO', detail: 'recon + KL' },
        ],
        loop: { from: 'elbo', to: 'encode', label: 'backprop' },
      },
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'medical-rag',
    title: 'Medical Assistant on a Local RAG Pipeline',
    tagline:
      'A retrieval-augmented assistant over a 1,152-page corpus that refuses to answer from memory.',
    discipline: 'ML',
    period: 'Jan 2024 - May 2024',
    status: 'shipped',
    tech: ['Python', 'LangChain', 'Pinecone', 'Ollama', 'Flask', 'Docker', 'AWS EC2'],
    problem:
      'A language model asked a medical question will answer it whether or not it knows, and a confident wrong answer in that domain is worse than no answer. Retrieval fixes part of this by grounding responses in a corpus, but only if the chain is actually constrained to the retrieved text instead of merely being offered it.',
    contribution:
      'I built the ingestion and serving pipeline end to end: 500-character overlapping chunks, top-3 retrieval, and 768-dimensional embeddings upserted into a cosine-similarity Pinecone index, served by a LangChain retrieval chain behind Flask. I ran inference fully locally through Ollama, which removed third-party LLM API dependencies entirely, and containerised the service with Docker on AWS EC2. The design decision I care about most is the explicit refusal fallback at temperature 0.4, which stops the model answering from parametric memory when retrieval comes back empty.',
    metrics: [
      { label: 'Corpus', value: '1,152 pages' },
      { label: 'Chunk size', value: '500 chars, overlapping' },
      { label: 'Retrieval', value: 'top-3, cosine' },
      { label: 'Embedding dimension', value: '768' },
    ],
    deepDive: [
      {
        heading: 'The refusal fallback',
        body: 'Most RAG demos pass retrieved context to the model and hope it uses it. If the retriever returns nothing relevant, the model falls back on what it absorbed during training and answers anyway. Constraining the prompt chain to retrieved context with an explicit refusal path means an out-of-corpus question produces a refusal rather than a fluent guess — which in a medical context is the correct output.',
      },
      {
        heading: 'Why local inference',
        body: 'Running Llama 3.2 and nomic-embed-text through Ollama removes the external API dependency completely: no per-token cost, no rate limit, and no medical queries leaving the machine. The trade-off is that you now own the serving problem, which is what Docker and EC2 are there for.',
      },
      {
        heading: 'Chunking as a retrieval decision',
        body: 'Chunk size and overlap are quietly the most consequential parameters in a RAG system. 500-character overlapping chunks keep enough context inside a single chunk to be self-explanatory while staying small enough that top-3 retrieval returns focused text rather than three pages of noise.',
      },
    ],
    links: { repo: 'https://github.com/mdhumayun7/medical-chatbot' },
    simulationId: 'rag-retrieval',
    diagrams: {
      arch: {
        caption:
          'Two paths through one index: documents are ingested once, queries traverse it on every request.',
        lanes: [
          {
            title: 'Ingestion',
            nodes: [
              { id: 'docs', label: 'Corpus', note: '1,152 pages' },
              { id: 'chunk', label: 'Chunker', note: '500 chars, overlap' },
              { id: 'embed', label: 'Embedder', note: 'nomic-embed-text' },
            ],
          },
          {
            title: 'Storage',
            nodes: [{ id: 'index', label: 'Pinecone', note: '768-dim, cosine' }],
          },
          {
            title: 'Query path',
            nodes: [
              { id: 'q', label: 'Query' },
              { id: 'retrieve', label: 'Retrieve', note: 'top-3' },
              { id: 'chain', label: 'LangChain', note: 'constrained prompt' },
            ],
          },
          {
            title: 'Serving',
            nodes: [
              { id: 'llm', label: 'Ollama', note: 'llama 3.2, local' },
              { id: 'api', label: 'Flask API', note: 'Docker on EC2' },
            ],
          },
        ],
        links: [
          { from: 'docs', to: 'chunk' },
          { from: 'chunk', to: 'embed' },
          { from: 'embed', to: 'index' },
          { from: 'q', to: 'retrieve' },
          { from: 'index', to: 'retrieve' },
          { from: 'retrieve', to: 'chain' },
          { from: 'chain', to: 'llm' },
          { from: 'llm', to: 'api' },
        ],
      },
      flow: {
        caption: 'A single request, including the path most pipelines leave out.',
        steps: [
          { id: 'ask', label: 'Question', detail: 'from user' },
          { id: 'vec', label: 'Embed', detail: '768-dim vector' },
          { id: 'top3', label: 'Retrieve', detail: 'top-3 chunks' },
          { id: 'guard', label: 'Ground or refuse', detail: 'temperature 0.4' },
          { id: 'answer', label: 'Response', detail: 'cited context' },
        ],
      },
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'job-agent',
    title: 'Multi-Source Job Intelligence Platform',
    tagline:
      'An eight-stage nightly data pipeline across eleven sources, built to degrade rather than fail.',
    discipline: 'Automation',
    period: 'Apr 2026 - Present',
    featured: true,
    status: 'shipped',
    tech: [
      'Python',
      'Playwright',
      'SQLite',
      'GitHub Actions',
      'Streamlit',
      'Groq',
      'OpenPyXL',
      'SMTP',
    ],
    problem:
      'This is an ingestion problem wearing the costume of a chore. Eleven upstream sources, none of them stable, none offering an API, all publishing overlapping records under inconsistent titles, with a correctness requirement that the same posting must never be counted twice. Government portals in particular change their markup without warning, so any pipeline that treats a source failure as a run failure produces nothing on most nights.',
    contribution:
      'I designed the pipeline around partial failure from the start. Each of the eleven scrapers runs headless under Playwright with its own retry isolation, so a broken government portal degrades one source instead of taking the nightly run down. Records land in SQLite through idempotent upserts, which makes reruns safe and the whole pipeline replayable. Entity resolution is the hard part: exact matching finds almost nothing across portals, so I used fuzzy matching via SequenceMatcher at a tuned 0.88 threshold combined with weighted skill scoring, collapsing 793 raw records to 357 ranked matches. Enrichment is optional by design — a Groq-hosted model re-scores and summarises listings when an API key is present, and the rule-based scorer takes over when it is not, so the pipeline never depends on a paid service to run. The eight stages fan out to Excel workbooks, HTML digests, grouped email alerts and a Streamlit dashboard, driven by GitHub Actions cron with secrets-based config.',
    metrics: [
      { label: 'Sources ingested', value: '11 boards + 9 govt portals' },
      { label: 'Records persisted', value: '2,158' },
      { label: 'After deduplication', value: '793 -> 357' },
      { label: 'Noise reduction', value: '55%' },
    ],
    deepDive: [
      {
        heading: 'Retry isolation is the whole trick',
        body: 'Scraping 11 sites means at least one is broken on any given night. Isolating retries per scraper means a failing government portal degrades that source only, instead of failing the run and producing no report — which is the difference between a pipeline you trust and one you check manually anyway.',
      },
      {
        heading: 'Fuzzy deduplication at 0.88',
        body: 'The same posting appears across portals with reworded titles, so exact matching finds almost nothing. SequenceMatcher at a 0.88 similarity threshold collapses near-duplicates without merging genuinely different roles; combined with weighted skill scoring it cut 793 raw records to 357 ranked matches, a 55% reduction in noise.',
      },
      {
        heading: 'Four outputs, one pipeline',
        body: 'The same eight-stage run surfaces results as Excel workbooks, HTML daily reports, grouped email digests and a Streamlit dashboard with charts and an application tracker. Keeping enrichment, filtering and ranking as pipeline stages rather than presentation logic is what makes four output formats cheap to maintain.',
      },
      {
        heading: 'Optional intelligence, mandatory fallback',
        body: 'A Groq-hosted model re-scores and summarises listings when an API key is configured, and the rule-based scorer takes over when it is not. Treating the LLM as an enhancement rather than a dependency means the pipeline still produces a ranked digest with no external service, no API key and no per-run cost — which is also what makes it safe to run unattended on a schedule.',
      },
      {
        heading: 'Beyond ingestion',
        body: 'Later stages parse a resume from PDF or DOCX and adjust bullet emphasis per listing, generate role-specific interview preparation sheets, and track application state across runs. These are the parts that turn a scraper into something actually used every day.',
      },
    ],
    links: { repo: 'https://github.com/mdhumayun7/job-agent' },
    diagrams: {
      arch: {
        caption: 'Scrapers are isolated from each other; everything downstream reads from SQLite.',
        lanes: [
          {
            title: 'Sources',
            nodes: [
              { id: 'gov', label: '9 govt portals' },
              { id: 'priv', label: '2 private boards' },
            ],
          },
          {
            title: 'Collection',
            nodes: [
              { id: 'play', label: 'Playwright', note: 'headless, isolated retries' },
              { id: 'db', label: 'SQLite', note: 'idempotent upserts' },
            ],
          },
          {
            title: 'Processing',
            nodes: [
              { id: 'dedup', label: 'Fuzzy dedup', note: 'SequenceMatcher 0.88' },
              { id: 'score', label: 'Skill scoring', note: 'weighted' },
            ],
          },
          {
            title: 'Outputs',
            nodes: [
              { id: 'xlsx', label: 'Excel report' },
              { id: 'mail', label: 'Email digest' },
              { id: 'dash', label: 'Streamlit' },
            ],
          },
        ],
        links: [
          { from: 'gov', to: 'play' },
          { from: 'priv', to: 'play' },
          { from: 'play', to: 'db' },
          { from: 'db', to: 'dedup' },
          { from: 'dedup', to: 'score' },
          { from: 'score', to: 'xlsx' },
          { from: 'score', to: 'mail' },
          { from: 'score', to: 'dash' },
        ],
      },
      flow: {
        caption: 'The nightly run, triggered by cron and never by hand.',
        steps: [
          { id: 'cron', label: 'Cron fires', detail: 'GitHub Actions' },
          { id: 'scrape', label: 'Scrape', detail: '11 portals' },
          { id: 'store', label: 'Persist', detail: 'SQLite upsert' },
          { id: 'clean', label: 'Deduplicate', detail: '793 -> 357' },
          { id: 'rank', label: 'Rank', detail: 'skill weights' },
          { id: 'send', label: 'Dispatch', detail: 'grouped alerts' },
        ],
      },
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'face-emotion',
    secondary: true,
    title: 'Facial Expression Recognition',
    tagline: 'A convolutional classifier over seven emotion classes, running live on webcam input.',
    discipline: 'ML',
    period: 'Sep 2025 - Oct 2025',
    status: 'shipped',
    tech: ['TensorFlow', 'Keras', 'OpenCV', 'CNN'],
    problem:
      'Expression recognition is a deceptively hard classification problem: the classes are visually close, the standard dataset is small and imbalanced, and a model that scores well offline is useless if it cannot keep up with a video feed.',
    contribution:
      'I designed and trained a convolutional network to classify facial expressions into seven emotion categories on FER-2013, using augmentation — rotation, zoom and shear — to control overfitting on a limited dataset. I then integrated it with OpenCV to process live video, keeping inference under 100 ms per frame so the classification stays usable in real time.',
    metrics: [
      { label: 'Test accuracy', value: '92%' },
      { label: 'Inference latency', value: 'under 100 ms' },
      { label: 'Classes', value: '7' },
    ],
    deepDive: [
      {
        heading: 'Augmentation as a dataset fix',
        body: 'FER-2013 is small enough that a network of any capacity will memorise it. Rotation, zoom and shear augmentation force the model to learn expression structure rather than the exact framing of the training images, which is what moved test accuracy rather than training accuracy.',
      },
    ],
    diagrams: {
      flow: {
        caption: 'Live inference path, from camera frame to label.',
        steps: [
          { id: 'frame', label: 'Frame', detail: 'OpenCV capture' },
          { id: 'detect', label: 'Detect face', detail: 'crop region' },
          { id: 'prep', label: 'Preprocess', detail: 'resize, normalise' },
          { id: 'cnn', label: 'CNN', detail: '7-class softmax' },
          { id: 'label', label: 'Label', detail: 'under 100 ms' },
        ],
      },
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'plant-disease',
    secondary: true,
    title: 'Plant Disease Classification',
    tagline: 'Transfer learning on ResNet50 to diagnose leaf disease from a photograph.',
    discipline: 'ML',
    period: 'Mar 2024 - Jul 2024',
    status: 'shipped',
    tech: ['TensorFlow', 'ResNet50', 'Flask', 'Transfer Learning'],
    problem:
      'Crop disease is cheapest to treat early, but early identification requires expertise that is not available in the field. A phone photograph is the one diagnostic input a farmer reliably has.',
    contribution:
      'I fine-tuned a ResNet50 backbone on a plant disease dataset rather than training from scratch, which is what makes the accuracy reachable on a dataset of this size. I then served the model through a Flask API with a simple frontend, so the output is an instant diagnostic report rather than a notebook cell.',
    metrics: [
      { label: 'Validation accuracy', value: '95%' },
      { label: 'Backbone', value: 'ResNet50' },
    ],
    deepDive: [
      {
        heading: 'Why transfer learning was the right call',
        body: 'Leaf disease datasets are small relative to the visual complexity of the task. Reusing ImageNet features means the network only has to learn what distinguishes healthy tissue from diseased, rather than relearning edges and textures from nothing.',
      },
    ],
    diagrams: {
      flow: {
        caption: 'From uploaded photo to diagnostic report.',
        steps: [
          { id: 'upload', label: 'Upload leaf', detail: 'web form' },
          { id: 'pre', label: 'Preprocess', detail: 'resize, normalise' },
          { id: 'resnet', label: 'ResNet50', detail: 'fine-tuned head' },
          { id: 'report', label: 'Report', detail: 'class + confidence' },
        ],
      },
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'sign-language',
    secondary: true,
    title: 'Real-Time Sign Language Recognition',
    tagline: 'Hand landmarks and an LSTM recognising dynamic gestures at 30 FPS on a CPU.',
    discipline: 'ML',
    period: 'Dec 2023 - Mar 2024',
    status: 'shipped',
    tech: ['MediaPipe', 'TensorFlow', 'LSTM', 'OpenCV'],
    problem:
      'Sign language is a sequence, not a set of poses: the meaning lives in movement over time, so a frame-by-frame image classifier cannot represent it. Any system meant for everyday use also has to run on ordinary hardware.',
    contribution:
      'I used MediaPipe to extract hand landmarks instead of feeding raw pixels to the network, which collapses each frame to a small coordinate vector and makes an LSTM over sequences tractable. Working on landmarks rather than images is also what let the pipeline hold 30 FPS on standard CPU hardware, with no GPU required.',
    metrics: [
      { label: 'Throughput', value: '30 FPS on CPU' },
      { label: 'Model', value: 'LSTM over landmark sequences' },
    ],
    deepDive: [
      {
        heading: 'Landmarks instead of pixels',
        body: 'Passing video frames straight into a network means most of the capacity is spent learning to find the hand. MediaPipe solves that separately and hands over coordinates, so the sequence model only has to learn the gesture — which is both more accurate on limited data and dramatically cheaper at inference.',
      },
    ],
    diagrams: {
      flow: {
        caption: 'Landmark extraction decouples seeing the hand from understanding the gesture.',
        steps: [
          { id: 'cam', label: 'Video frame' },
          { id: 'mp', label: 'MediaPipe', detail: 'hand landmarks' },
          { id: 'buf', label: 'Sequence buffer', detail: 'sliding window' },
          { id: 'lstm', label: 'LSTM', detail: 'gesture class' },
          { id: 'out', label: 'Output', detail: '30 FPS' },
        ],
      },
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'smart-home-surveillance',
    secondary: true,
    title: 'Smart Home Surveillance System',
    tagline: 'An IoT monitoring rig on Raspberry Pi and Arduino with cloud-backed alerting.',
    discipline: 'Systems',
    period: 'Mar 2024 - Aug 2024',
    status: 'shipped',
    tech: ['Raspberry Pi', 'Arduino', 'IoT', 'Cloud Storage'],
    problem:
      'Home monitoring is only useful if it reaches you when you are not home, which turns a sensor project into a networking and storage problem.',
    contribution:
      'I built an IoT surveillance system integrating five or more sensors and modules across Raspberry Pi and Arduino for real-time motion detection, with Wi-Fi enabled monitoring, cloud storage for captured events, and mobile and web access for continuous remote surveillance and intruder notification.',
    metrics: [
      { label: 'Sensors integrated', value: '5+' },
      { label: 'Coverage', value: '24/7 remote' },
    ],
    diagrams: {
      flow: {
        caption: 'Detection to notification, with storage in between.',
        steps: [
          { id: 'sensor', label: 'Motion sensor', detail: 'Arduino' },
          { id: 'pi', label: 'Raspberry Pi', detail: 'capture + upload' },
          { id: 'cloud', label: 'Cloud storage', detail: 'event archive' },
          { id: 'alert', label: 'Alert', detail: 'mobile + web' },
        ],
      },
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'ips-ml',
    title: 'IPS-ML / ShieldNet — Intrusion Prevention with Explainable AI',
    tagline:
      'An inline prevention system where a false positive drops a real connection, so the cost of being wrong is measured.',
    discipline: 'Security',
    period: 'Aug 2025 - 2026',
    featured: true,
    status: 'research',
    tech: ['Python', 'scikit-learn', 'XGBoost', 'SHAP', 'CICIDS2017', 'pytest'],
    problem:
      'A signature-based intrusion prevention system can only catch attacks somebody has already written a rule for, and encryption is steadily removing the payload those rules inspect. Machine learning on flow metadata gets past both limits, but an inline device executes its own predictions: a false positive does not raise an alert for a human to dismiss, it drops a legitimate connection. That changes what the model is. It is no longer a classifier, it is one component of a control system, and it has to be evaluated as one.',
    contribution:
      'My M.Tech dissertation. I trained six detectors and a soft-voting ensemble on 2,497,980 audited CICIDS2017 flows and evaluated every one on the identical held-out set of 749,394. Three design decisions carry the work. First, prevention is confidence-aware: instead of argmax, decisions are ALLOW, UNCERTAIN or BLOCK, with the operating point chosen by sweeping the threshold against a stated false-alarm budget. Second, SHAP attributions are computed inside the enforcement path and written to an append-only audit log beside the action, so every block is explainable after the fact. Third, evaluation is security-first: recall and false alarm rate are the headline metrics, not accuracy, and every reported number is recomputed from stored artefacts rather than trusted from a training log.',
    metrics: [
      { label: 'Ensemble macro-F1', value: '0.8814' },
      { label: 'False alarm rate', value: '0.00135' },
      { label: 'Attack flows missed', value: '0.0149%' },
      { label: 'Inference median', value: '0.432 ms' },
    ],
    deepDive: [
      {
        heading: 'Why accuracy is deliberately not the headline',
        body: 'On this corpus, a model that predicts "benign" for every single flow scores 82.96% accuracy and detects nothing. That failure mode is encoded as a unit test rather than left as a footnote. Logistic Regression demonstrates it live: 0.7958 accuracy looks respectable next to a 0.3955 macro-F1 and a 23.9% false alarm rate, which would be unusable inline.',
      },
      {
        heading: 'Three outcomes instead of two',
        body: 'Adding an UNCERTAIN band between ALLOW and BLOCK routes 1.62% of traffic to human review. That review cost buys a strict improvement on both error types at once: missed attacks fall to 0.0149% and benign disruption to 0.0486%, against 0.0462% and 0.1337% for the two-outcome configuration. Paying a small, bounded cost to improve both sides of a trade-off is the entire argument of the project.',
      },
      {
        heading: 'Choosing the operating point instead of inheriting it',
        body: 'Sweeping the allow threshold shows how much of the decision argmax was quietly making for you. At 0.01 the detector catches everything at a 37.5% false alarm rate, which no network would tolerate. At 0.95 the false alarm rate falls to 0.065% but detection drops to 0.9766. At 0.38 detection is 0.9999 with a 0.897% false alarm rate, inside a stated 1% budget.',
      },
      {
        heading: 'Where the gains actually are',
        body: 'Against the Random Forest baseline reported by Engelen et al. (WTMC 2021) on the same files, improvements concentrate in the rare classes and were obtained without synthetic oversampling: SQL injection F1 rises from 0.11 to 0.50, Heartbleed from 0.77 to 1.00, XSS from 0.18 to 0.40, Bot from 0.60 to 0.78. The common classes were already saturated at ~0.99 and stayed there.',
      },
      {
        heading: 'Stated limitations',
        body: 'No hyper-parameter tuning, so the reported macro-F1 is a lower bound. A single stratified 70/30 hold-out, so no confidence intervals, and the rarest classes are marked anecdotal. No cross-dataset validation, so generalisation is an objective rather than a result. Enforcement is simulated: the engine returns a firewall rule as a string and never executes it, asserted by a unit test. All thirteen deviations are logged with impact ratings in the repository rather than buried.',
      },
    ],
    links: { repo: 'https://github.com/mdhumayun7/ips' },
    simulationId: 'threshold-sweep',
    diagrams: {
      arch: {
        caption:
          'The detector is one stage in a control system: every prediction becomes an action, and every action carries its explanation.',
        lanes: [
          {
            title: 'Data',
            nodes: [
              { id: 'flows', label: 'CICIDS2017', note: '2.5M audited flows' },
              { id: 'prep', label: 'Preprocessing', note: 'leakage measured' },
            ],
          },
          {
            title: 'Detection',
            nodes: [
              { id: 'zoo', label: 'Model zoo', note: '6 detectors' },
              { id: 'ens', label: 'Soft-voting', note: 'ensemble' },
            ],
          },
          {
            title: 'Decision',
            nodes: [
              { id: 'thresh', label: 'Threshold sweep', note: 'against FAR budget' },
              { id: 'engine', label: 'Action engine', note: 'ALLOW / UNCERTAIN / BLOCK' },
            ],
          },
          {
            title: 'Accountability',
            nodes: [
              { id: 'shap', label: 'SHAP', note: 'at decision time' },
              { id: 'audit', label: 'Audit log', note: 'append-only' },
            ],
          },
        ],
        links: [
          { from: 'flows', to: 'prep' },
          { from: 'prep', to: 'zoo' },
          { from: 'zoo', to: 'ens' },
          { from: 'ens', to: 'thresh' },
          { from: 'thresh', to: 'engine' },
          { from: 'engine', to: 'shap' },
          { from: 'shap', to: 'audit' },
        ],
      },
      flow: {
        caption: 'One flow through the prevention path, explanation included.',
        steps: [
          { id: 'flow', label: 'Flow arrives', detail: 'metadata only' },
          { id: 'score', label: 'Score', detail: 'ensemble probability' },
          { id: 'band', label: 'Band', detail: 'allow / uncertain / block' },
          { id: 'explain', label: 'Explain', detail: 'SHAP attribution' },
          { id: 'act', label: 'Act + log', detail: '0.432 ms median' },
        ],
      },
    },
  },

  {
    id: 'backend-system-design',
    title: 'Low-Level Design — Spotify and Zomato',
    tagline:
      'Two consumer systems modelled from scratch: class design first, UML committed alongside the code.',
    discipline: 'Systems',
    period: '2026',
    status: 'shipped',
    tech: ['C++', 'Object-oriented design', 'UML', 'Design patterns'],
    problem:
      'Low-level design is the interview round that cannot be crammed, because it asks for judgement rather than recall: which entities exist, what each one owns, and where behaviour belongs when requirements change. Reading about design patterns does not build that judgement — modelling a system somebody else already built, and then defending the choices, does.',
    contribution:
      'I modelled two systems end to end. A music player application in the shape of Spotify — playlists, playback control, device and strategy handling — and a food delivery system in the shape of Zomato. Each one is committed with its UML diagram beside the implementation, so the class relationships are reviewable independently of the code rather than reconstructed from it.',
    links: { repo: 'https://github.com/mdhumayun7/Backend-System-design' },
  },
]

/** Every discipline present, for the filter bar. Derived, never hardcoded. */
export const disciplines = [...new Set(projects.map((p) => p.discipline))].sort()
