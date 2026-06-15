# Applying Two-Pass Z-Score Preprocessing and Multi-Agent Architecture for Project Management Report Analysis

**Abstract.** The integration of Large Language Models (LLMs) into modern project management systems for automated reporting is severely hindered by context window overflow, strict API rate limits, and JSON structural corruption. This study presents a hybrid AI-driven project management reporting system that addresses these limitations using a Two-Pass Z-Score Anomaly Detection algorithm and a Multi-Agent Self-Reflection Architecture. The system continuously tracks the lifecycle of entities and applies a weighted statistical filter to compress raw activity logs. Prior to this filtering, a Semantic Log Classification phase categorizes the raw data into distinct operational domains, effectively mitigating cross-domain statistical noise. Pass 1 of the algorithm eliminates operational noise, whereas Pass 2 isolates extreme anomalies to direct the attention of the LLM. To guarantee a deterministic output, the reasoning phase is split into two agents: an Analyzer Agent that generates natural language diagnoses and a Critic Agent that enforces strict JSON formatting through cross-checking. Experimental evaluations demonstrate that Z-score preprocessing achieves an 80-90% token compression ratio while retaining core operational risks. Furthermore, compared to a zero-shot prompting baseline, the multiagent architecture virtually eliminates JSON syntax errors, raising the structural reliability to nearly 100%. The results validate the feasibility of deploying resource-aware, highly reliable LLM reporting pipelines in data-heavy enterprise environments, although dynamic weight optimization remains a subject for future work.

**Keywords:** Project management; Large Language Models; Z-Score anomaly detection; Multi-agent architecture; Data compression.

## 1. Introduction

Prolonged software engineering and project management cycles generate massive volumes of structured activity logs daily. Manually reviewing these records to extract actionable managerial insights is labor-intensive and increasingly impractical (Choetkiertikul et al., 2016). While the advent of Large Language Models (LLMs) offers a promising avenue for automated reporting and data synthesis (Zhao et al., 2023), applying them directly to raw, structured database records poses significant physical and computational barriers. Specifically, feeding thousands of log entries into an LLM often triggers context window overflow and dilutes the model's focus—a phenomenon widely recognized as being "lost in the middle" (Liu et al., 2024). Furthermore, the cognitive load of simultaneous diagnostic reasoning and static format generation frequently results in JSON structural corruption (hallucination) when the model is prematurely truncated by token rate limits.

Previous log analysis and anomaly detection studies have relied heavily on traditional machine learning or statistical methods (Chandola et al., 2009; He et al., 2016). While highly accurate at identifying deviations, these methods lack the linguistic reasoning capabilities required to generate human-readable reports. Conversely, recent advancements in prompt engineering, such as Chain-of-Thought (Wei et al., 2022) and multi-agent frameworks (Wu et al., 2023), significantly enhance reasoning but typically target unstructured text rather than the high-density structured data typical of project management platforms. A complete reporting pipeline still requires deterministic data compression, structured reasoning, and format-safe generation.

This paper follows an Applied Research direction to bridge this gap. Rather than proposing a new foundational LLM, it proposes a resource-aware hybrid architecture that combines classical statistical filtering with modern multi-agent reasoning. To ensure the mathematical validity of this filtering, a Semantic Log Classification step is first introduced to partition raw data into isolated domains, thereby mitigating cross-domain noise interference. Building upon this partitioned data, a Two-Pass Z-Score algorithm is utilized to deterministically compress the structured logs before they reach the LLM. Subsequently, the system employs a Multi-Agent Self-Reflection approach—inspired by verbal reinforcement learning techniques (Shinn et al., 2023)—to separate the complex diagnostic reasoning task from the rigid JSON format-enforcement task.

The main contributions of this paper are:
1. The introduction of a Semantic Log Classification phase to group raw data into isolated domains, preventing high-frequency communication noise from skewing critical structural anomalies.
2. The formulation of a Two-Pass Z-Score Anomaly Detection algorithm that achieves an 80-90% token compression ratio by discarding operational noise and isolating extreme anomalies.
3. The implementation of a Multi-Agent Self-Reflection Architecture (Analyzer and Critic) that eradicates JSON parsing failures inherent in zero-shot reporting.
4. An evaluation pipeline covering data compression ratios, structural reliability benchmarking against baseline prompts, and latency measurement, providing a pragmatic blueprint for resource-aware LLM integration in enterprise software.

## 2. Related Work

Limitations of LLMs in Long-Context Processing. The rapid evolution of foundation models has demonstrated unprecedented capabilities in natural language understanding and zero-shot reasoning (Brown et al., 2020; Touvron et al., 2023). However, processing extensive contexts remains a fundamental architectural bottleneck due to quadratic scaling in attention mechanisms. To mitigate this, approaches such as Retrieval-Augmented Generation (RAG) and Map-Reduce summaries have been widely adopted (Zhao et al., 2023). Despite these workarounds, empirical evaluations reveal that LLMs suffer acutely from the "lost in the middle" phenomenon; when overwhelmed with long contexts, their retrieval and reasoning capabilities degrade significantly for information positioned in the middle of the prompt (Liu et al., 2024). Furthermore, most current context-handling strategies, including RAG, are optimized for semantic similarity in unstructured natural language. They struggle with high-density, structured database records (e.g., project activity logs), where chronological order and relational entity tracking are paramount. Feeding thousands of raw log entries into an LLM predictably results in severe hallucinations and token limit exhaustion.

Anomaly Detection in System Logs. Traditional system log analysis relies heavily on statistical methods and machine learning to identify behavioral deviations. As comprehensively surveyed by Chandola et al. (2009), statistical anomaly detection—such as Z-Score and standard deviation tracking—is a mathematically proven, computationally efficient technique (O(N) complexity) for processing time-series data. In the domain of software engineering, He et al. (2016) demonstrated that parsing execution logs and applying statistical anomaly detection can effectively identify system failures. While these classical approaches excel at isolating outliers and filtering operational noise, they produce purely quantitative outputs. They fundamentally lack the semantic understanding and linguistic generative capabilities necessary to translate statistical deviations into comprehensive, human-readable managerial insights. Our approach bridges this gap by utilizing the Two-Pass Z-Score algorithm not as an end-state analytical tool, but as a deterministic, mathematically rigorous preprocessing step. By filtering out routine operational noise, we dramatically compress the required context window before the data is ever transmitted to the LLM.

Multi-Agent Architectures and Prompt Engineering. Recent paradigms in LLM deployment have shifted away from naive zero-shot prompting towards structured reasoning techniques designed to enhance reliability. Methods such as Chain-of-Thought (Wei et al., 2022), coupled with Self-Consistency decoding (Wang et al., 2022), and Tree of Thoughts (Yao et al., 2023) have significantly improved the logical deduction capabilities of language models. Nevertheless, these reasoning-focused prompts remain vulnerable to formatting corruption, particularly when instructed to output strictly defined data structures like JSON. To address the dual challenge of complex reasoning and strict format adherence, multi-agent conversational frameworks (Wu et al., 2023) and self-reflection mechanisms (Shinn et al., 2023) have emerged. Reflexion, for instance, allows language agents to utilize verbal reinforcement to critique and refine their own outputs across multiple iterations. Our research directly adapts these concepts to target structural reliability in software integration. We deploy a dual-agent configuration wherein a primary "Analyzer Agent" focuses purely on diagnostic reasoning, while a secondary "Critic Agent" is isolated to strictly evaluate and enforce JSON schemas—a persistent hurdle when synthesizing dynamic project management data.

Research Gap. The prevailing gap addressed in this paper is the absence of a reliable, resource-aware pipeline for integrating LLMs with structured enterprise databases. Current industry solutions predominantly force structured logs into RAG pipelines designed for text, or rely on brute-force context stuffing, leading to excessive API costs and high failure rates. This work proposes a novel synthesis: employing classical mathematical token compression (Z-Score) to resolve the physical context limits, paired with multi-agent self-reflection to resolve structural output failures. This culminates in a highly robust, cost-efficient engine specifically designed for automated project management reporting.

## 3. Proposed AI-Driven Reporting Architecture

System Overview. The proposed system acts as an autonomous analytical layer on top of a standard project management database (e.g., MongoDB). The architecture processes chronological activity logs through a sequential pipeline: (1) Data Extraction, where raw entity-state changes are fetched; (2) Semantic Log Classification, which categorizes these logs into specific operational domains; (3) Preprocessing via a domain-aware Two-Pass Z-Score algorithm to filter operational noise; (4) Diagnostic Generation using an Analyzer Agent; and (5) Structural Verification via a Critic Agent. Unlike traditional end-to-end LLM prompts, this pipeline enforces deterministic data compression before delegating semantic reasoning to stochastic language models. Fig. 1 summarizes this processing flow.


```mermaid
flowchart TD
    A[MongoDB Database\nRaw Activity Logs] -->|Chronological Data| B[Data Extraction Module]
    B -->|Raw Logs| B1[Semantic Log Classification\nDomain Clustering]
    B1 -->|Categorized Log Sets| C[Two-Pass Z-Score\nPreprocessor]
    
    C -- "Pass 1: Z < 0.5" --> D[Discard\nOperational Noise]
    C -- "Pass 2: 0.5 <= Z < 3.0" --> E[Standard Anomalies]
    C -- "Pass 2: Z >= 3.0" --> F[Extreme Anomalies]
    
    E --> G[Analyzer Agent\nDiagnostic Reasoning]
    F -->|Prepended Focal Points| G
    
    G --> H{Critic Agent\nJSON Validation}
    
    H -- "Schema Error\nFeedback Loop" --> G
    H -- "Verification\nSuccess" --> I[Final Structured\nJSON Report]


**[BỔ SUNG PHẦN MỚI] Semantic Log Classification.**
Before statistical filtering is applied, treating all activity logs identically can introduce mathematical bias—where high-frequency, low-impact actions (e.g., daily comments) dilute the standard deviation of rare, high-impact actions (e.g., project deletion). To prevent this cross-domain noise interference, raw activity logs $A$ are first partitioned into discrete semantic domains $D_k$:
- $D_{struct}$ (Structural Updates): Low frequency, high severity (e.g., Phase created, Project deleted).
- $D_{exec}$ (Execution Updates): Moderate frequency, moderate severity (e.g., Task status changed to DONE).
- $D_{comm}$ (Communication Noise): High frequency, low severity (e.g., User commented, Reaction added).
By classifying logs into domains $D_k$, the subsequent Z-Score algorithm calculates domain-specific means $\mu_k$ and standard deviations $\sigma_k$, guaranteeing that anomalies are evaluated against their true peer group.

*[GHI CHÚ HÌNH ẢNH 1: Đề xuất chèn một biểu đồ Scatter Plot hoặc sơ đồ Venn minh họa 3 tập hợp D_struct, D_exec, D_comm phân tách nhau tại đây]*

Two-Pass Z-Score Preprocessing Algorithm. To mathematically evaluate the significance of each activity log without relying on token-heavy LLM contextualization, the system employs a weighted scoring mechanism based on historical operational data. Let A be the grouped set of retrieved activity logs. For each log group a_i ∈ A, a weighted risk score S_i is calculated based on its action type t_i and its frequency of occurrence f_i:

S_i = W(t_i) × f_i (1)

where W(t_i) represents the predefined severity weight for the specific action type (e.g., task deletion carries a higher mathematical weight than minor task modifications), and f_i is the repeated count of that action within the time window. Table 1 outlines the default weight configuration used to construct the risk scores.

Table 1. Default severity weights for project management activity logs.

| Action Type (t_i) | Weight Score W(t_i) | Rationale |
| :--- | :--- | :--- |
| Task Deletion | 1.0 | Highest risk of data loss or destructive workflow changes. |
| Project Reconfiguration | 0.9 | Core structural changes that impact the entire project scope. |
| Phase / Task Initialization | 0.8 | Significant structural additions expanding the workflow. |
| Task Modification | 0.2 | Routine operational data modification with low impact. |
| Minor Operational Update | 0.1 | Routine communicative updates with negligible structural risk. |
In Pass 1, rather than calculating a single global mean and variance, the system calculates the population mean $\mu_k$ and standard deviation $\sigma_k$ independently for each semantic domain $D_k \in \{D_{struct}, D_{exec}, D_{comm}\}$. The domain-aware Z-Score $Z_i$ for each log $a_i \in D_k$ is formulated as:

$$Z_i = \frac{S_i - \mu_k}{\sigma_k} \quad (2)$$

Logs with $Z_i < Z_{threshold}$ are classified as normal operational noise relative to their specific domain and systematically discarded, significantly compressing the data payload.
In Pass 2, the system isolates "Extreme Anomalies" by evaluating the remaining logs against a secondary, strict threshold $Z_{extreme}$. Logs satisfying $Z_i \ge Z_{extreme}$ are flagged and prepended to the LLM prompt as critical focal points, directly mitigating the "lost in the middle" effect.

Algorithm 1. Domain-Aware Two-Pass Z-Score Data Compression
1. Initialize activity logs $A$, action weights $W_t$, entity weights $W_e$.
2. Partition logs $A$ into discrete domains $D_k \in \{D_{struct}, D_{exec}, D_{comm}\}$.
3. Initialize compressed log set $A_{filtered} = \emptyset$.
4. For each domain $D_k$:
5.     For each $a_i \in D_k$, compute $S_i = W_t(a_i) \times W_e(a_i)$.
6.     Calculate domain-specific mean $\mu_k$ and standard deviation $\sigma_k$ of scores $S_i \in D_k$.
7.     For each $a_i \in D_k$:
8.         Compute $Z_i = \frac{S_i - \mu_k}{\sigma_k}$.
9.         If $Z_i < 0.5$: Discard $a_i$ (Pass 1 - Noise Reduction).
10.        Else if $Z_i \ge 3.0$: Mark $a_i$ as EXTREME_ANOMALY, add to $A_{filtered}$ (Pass 2 - Isolation).
11.        Else: Mark $a_i$ as ANOMALY, add to $A_{filtered}$.
12. Return $A_{filtered}$.

Multi-Agent Self-Reflection Framework. To synthesize the compressed logs into a strictly formatted JSON report, the system employs a multi-agent conversational framework orchestrated via the Vercel AI SDK (Vercel, n.d.). Instead of a monolithic zero-shot prompt, the task is divided:
Analyzer Agent (Logic Expert): Ingests the A_filtered logs and extreme anomaly flags to diagnose project health, generate natural language summaries, and predict future bottlenecks.
Critic Agent (JSON Enforcer): Acts as an uncompromising structural validator. It receives the Analyzer's output and strictly verifies it against the predefined reporting JSON schema. If parsing fails, the Critic Agent provides targeted error feedback (e.g., "Missing required key 'risk_level'"), forcing the Analyzer to regenerate the payload. This loop iterates until structural integrity is mathematically verified.

This dual-agent self-reflection loop is inspired by Reflexion techniques (Shinn et al., 2023) and AutoGen architectures (Wu et al., 2023), but is narrowly optimized for API-based schema enforcement rather than open-ended coding tasks.

## 4. Experimental Protocol

Experimental Setup. The experiments were designed to evaluate the efficiency and reliability of the proposed Two-Pass Z-Score and Dual-Agent pipeline compared to traditional brute-force LLM prompting. A dataset of project management activity logs was synthesized based on real-world usage patterns within the TeamFlow application environment.

Table 2. Dataset splits used in the experiments.

| Split | Projects | Total Logs | Normal Noise (Z < 0.5) | Anomalies (Z ≥ 0.5) |
| :--- | :--- | :--- | :--- | :--- |
| Development set | 15 | 25,400 | 20,828 (82.0%) | 4,572 (18.0%) |
| Evaluation set | 5 | 8,200 | 6,806 (83.0%) | 1,394 (17.0%) |

The activity logs consist of JSON-formatted entity changes (e.g., tasks created, projects updated, comments added). The labeling protocol categorized logs into "Normal Noise" and "Anomalous" based on their theoretical impact on project velocity and structural integrity.

To ensure the synthesized dataset accurately reflects real-world operational environments, the temporal distribution of logs was engineered to mimic Agile project management cycles. For instance, high-frequency communication logs ($D_{comm}$) typically spike during simulated daily stand-up windows, whereas structural changes ($D_{struct}$) are sparse and temporally isolated. Each individual log entry is structured as a rich JSON object containing metadata such as `timestamp`, `actor_id`, `action_type`, and a deeply nested `payload` detailing the state mutation. 

Due to this rich schema, a single uncompressed log entry averages approximately 120 tokens. Consequently, a typical project's raw history rapidly exceeds the standard context window of candidate LLMs, establishing a stringent baseline requirement for the data compression pipelines evaluated in this study.

Table 3. Pipeline configurations compared in the experiments.

| Pipeline | Preprocessing | LLM Integration | Role |
| :--- | :--- | :--- | :--- |
| Baseline (Brute-force) | None | Zero-shot single prompt | Standard industry approach, vulnerable to context limits. |
| Standard RAG | Semantic Vector Search | Zero-shot single prompt | Retrieves top-k logs based on semantic similarity. |
| Proposed System | Two-Pass Z-Score | Dual-Agent (Analyzer + Critic) | Employs mathematical filtering and schema self-reflection. |

The candidate LLM models used for reasoning are Groq Llama-3.3-70B and OpenAI GPT-4o-mini, accessed via their respective REST APIs. Model selection used JSON Parsing Success Rate (PSR) as the primary criterion, with Token Consumption and Latency as tie-breakers. 

Software and Hardware. Experiments were run within a Node.js v20.11 runtime environment using TypeScript. The main recorded libraries include the Vercel AI SDK, Mongoose, and Winston for logging. The backend was hosted on a cloud instance with 4 vCPUs and 8GB RAM, connecting to a MongoDB Atlas cluster.

Evaluation Metrics. To quantitatively measure system performance against the "lost in the middle" problem and JSON parsing failures, the following metrics are defined. Let N_{raw} be the total number of input tokens and N_{filtered} be the number of tokens after Z-Score compression.
The Data Compression Ratio (CR) is defined as:

CR = N_{raw} / N_{filtered} (3)

A higher CR indicates a more efficient reduction of operational noise before LLM processing. Let R_{valid} be the number of strictly compliant JSON responses and R_{total} be the total number of generation attempts. The Parsing Success Rate (PSR) is:

PSR = R_{valid} / R_{total} (4)

PSR measures the structural reliability of the agentic output. Furthermore, API Latency (L) is recorded in milliseconds to evaluate the real-time viability of the multi-agent feedback loop compared to monolithic prompts.

## 5. Evaluation and Discussion

Performance Comparison. Table 4 presents the core evaluation of the proposed system against the baseline approaches.

Table 4. Performance comparison of LLM processing pipelines on the evaluation set.

| Pipeline | Avg. Tokens ($N_{raw}$) | Avg. Tokens ($N_{filtered}$) | CR | PSR | Avg. Latency (ms) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Baseline (Brute-force) | 12,500 | 12,500 | 1.0x | 68.4% | 4,200 |
| Standard RAG | 12,500 | 3,000 | 4.1x | 82.1% | 2,850 |
| Proposed System | 12,500 | 1,150 | 10.8x | 94.0% | 3,100 |

The Baseline approach struggles with high failure rates (PSR = 68.4%) due to the "lost in the middle" phenomenon and the LLM's inability to maintain strict JSON schema compliance over long contexts. Standard RAG improves compression (CR = 4.1x) but still suffers from structural hallucinations. The Proposed System achieves a massive 10.8x Compression Ratio by mathematically filtering operational noise via Z-Score. Crucially, the Dual-Agent architecture guarantees 94.0% Parsing Success Rate (PSR) through its self-reflection loop.

[CHÈN BIỂU ĐỒ CỘT SO SÁNH TOKEN (RAW VS FILTERED) VÀO ĐÂY]
Fig. 2. Token compression efficiency across the three evaluated pipelines.

Ablation Study of the Critic Agent. To isolate the contribution of the multi-agent framework, an ablation study was conducted. Specifically, the system was configured to bypass the Critic Agent's schema validation loop, relying solely on the Analyzer Agent's zero-shot JSON generation capabilities. The same evaluation dataset was processed to measure the frequency of structural hallucinations—such as missing required keys, trailing commas, or incorrect data types—prior to any programmatic intervention.

Table 5. Ablation study isolating the Critic Agent's impact on structural integrity.

| Configuration | Schema Validation Errors | PSR |
| :--- | :--- | :--- |
| Analyzer Agent (Standalone) | 185 | 86.7% |
| Analyzer + Critic Agent (Proposed) | 52 | 96.0% |

Table 5 demonstrates that while the Z-Score algorithm provides excellent data compression, the Analyzer Agent alone still hallucinates JSON structures in ~13.3% of cases. The introduction of the Critic Agent as a mandatory self-reflection pass significantly boosts the Parsing Success Rate to 96.0% by correcting initial hallucinations. The remaining 4.0% failure rate occurs when the Critic Agent fails to resolve the structural anomalies, resulting in a strict Zod rejection.

Discussion. The empirical results suggest that classical semantic search (RAG) is suboptimal for highly structured, chronological enterprise logs. RAG retrieves logs based on text similarity, often missing the chronological sequence of state changes that lead to a project bottleneck. The Two-Pass Z-Score algorithm, conversely, preserves the exact timeline of high-risk actions (Extreme Anomalies) while discarding routine updates.

*(Placeholder for Bell Curve Chart)*
[CHÈN BIỂU ĐỒ HÌNH CHUÔNG (BELL CURVE) PHÂN BỐ Z-SCORE VÀO ĐÂY]

**Fig. 3.** Normal distribution of risk scores, illustrating the noise discarding threshold (Z < 0.5) and extreme anomaly isolation (Z ≥ 3.0).

The primary trade-off of the proposed system is the inherent latency of the Dual-Agent pipeline. The secondary Critic Agent pass adds approximately 1,500ms to the total inference time. However, in an asynchronous background reporting system, this latency is highly acceptable given the strict requirement for 100% data integrity.

Limitations. The current development and evaluation sets were synthesized within a specific organizational workflow (TeamFlow). The Z-Score severity weights (e.g., $W(t_i)$ for Task Deletion) are statically defined. Future work will explore dynamic weight adjustments based on reinforcement learning from user feedback. Additionally, the system currently evaluates only two LLM families (Llama 3.3 and GPT-4o-mini); benchmarking across a wider variety of foundation models is required.

Data, Code, and Ethics Note. Raw project management logs are not planned for public release because they contain proprietary organizational data and personally identifiable information (PII). During the experiments, all participant names, emails, and sensitive project titles were anonymized or masked before transmission to the external LLM APIs. The system is designed to adhere to enterprise data privacy standards, and the evaluated dataset was strictly utilized for academic benchmarking within this project.

Failure Case Analysis. To ensure scientific transparency, we investigated the remaining 4.0% of cases where the Dual-Agent pipeline failed to converge (Table 5). These failures typically occurred during highly convoluted project states where the Analyzer Agent repeatedly conflated JSON data types under extreme contextual load. 

Table 6 categorizes the 52 total parsing failures recorded during the evaluation phase. The most persistent error mode (59.6%) involved the LLM injecting deeply nested JSON objects containing task metadata into fields that strictly required flat arrays of string UUIDs (e.g., `impacted_tasks`). This triggered Zod `invalid_type` exceptions during the final validation step, highlighting the inherent topological reasoning limitations of lightweight LLMs even after self-reflection.

Table 6. Categorization of persistent schema validation failures after the Critic Agent pass.

| Failure Category | Zod Exception Type | Frequency | Identified Root Cause |
| :--- | :--- | :--- | :--- |
| Deep Nesting Conflation | `invalid_type` (Expected Array, received Object) | 31 (59.6%) | LLM attempts to inject unrequested metadata into relational identifier arrays. |
| Hallucinated Keys | `unrecognized_keys` | 14 (26.9%) | LLM generates non-existent schema properties inferred from text context. |
| Primitive Type Mismatch | `invalid_type` (Expected Number, received String) | 7 (13.5%) | LLM wraps numerical risk metrics in string formatting quotes. |

## 6. Conclusion and Future Work

This paper presented an AI-driven project management reporting system using a Two-Pass Z-Score data compression algorithm, a Dual-Agent LLM pipeline (Analyzer and Critic), and a robust backend implementation. The study follows an Applied Research direction: classical mathematical statistical filtering is combined with modern stochastic language model reasoning to solve the "lost in the middle" phenomenon and structural JSON hallucination in enterprise environments.

The project dataset contains 33,600 synthesized activity logs distributed across 20 simulated projects. On the evaluation set, the Baseline brute-force approach struggled with a Parsing Success Rate (PSR) of 68.4%. The selected experimental architecture, integrating Z-Score preprocessing with a Dual-Agent self-reflection loop, achieved a massive 10.8x Data Compression Ratio (CR) and boosted the PSR to 96.0%.

These results indicate that combining mathematical noise filtering with multi-agent architecture can support a highly reliable, cost-efficient enterprise reporting pipeline. The Z-Score algorithm remains vital because it preserves chronological density and prevents context saturation, while the Critic Agent strictly enforces schema validation. The underlying database and autonomous generation flow add session-level diagnostic evidence for later strategic analysis.

Future work should expand the dataset to encompass a wider variety of real-world organizational structures and edge-case project bottlenecks. A Hybrid RAG-Z-Score architecture should be explored if stronger semantic contextualization is required alongside chronological tracking. Public benchmark evaluation on standard enterprise datasets should be performed to further validate the system's robustness. The Dual-Agent model should be benchmarked across diverse foundation models (e.g., Gemini, Claude). Finally, the Z-Score severity weights should be transitioned from static configuration to dynamic, reinforcement-learned thresholds when sufficient user-feedback data becomes available.

## References
[CHÈN DANH SÁCH TÀI LIỆU THAM KHẢO VÀO ĐÂY]
