---
title: "Structured workflows for coding with AI agents using the Breadcrumb Protocol"
date: 2025-04-02 12:00
header:
  teaser: /assets/images/breadcrumb-protocol-teaser.png
comments: true
categories: [software development, AI, agents, vice coding]
tags: [github copilot, agents, vibe coding]
toc: true
toc_label: "Content"
toc_sticky: true
---
I've been exploring [hypervelocity engineering](https://www.linkedin.com/pulse/what-hypervelocity-engineering-mike-lanzetta-ckfwc/) workflows with AI agents like GitHub Copilot, and one fundamental challenge continues to surface: maintaining shared context alignment between developers and AI. While AI excels at generating code, it lacks inherent "memory" of past interactions and the nuanced understanding that humans naturally build over time. This alignment gap grows wider as projects become more complex, yet having a structured approach to bridge this divide is often overlooked. How can we ensure both the developer and AI are working with the same mental model throughout the development process?

>The protocol referenced in this post is hosted at https://github.com/dasiths/VibeCodingBreadcrumbDemo.

## The Why

At the heart of effective AI collaboration lies a shared understanding. When a development task begins, you provide specific instructions to the AI agent with a clear goal - perhaps creating a new feature or solving a specific problem. The initial conversation achieves its immediate purpose, and the workflow feels seamless. All good so far.

But as your project grows and evolves, something critical begins to happen: the context that lives in your head diverges from what's available to the AI. Without an explicit mechanism to synchronize this mental model, each new interaction requires re-establishing context, explaining background decisions, and repeating architectural principles. The AI lacks the persistent, nuanced understanding of your specific project that you naturally maintain.

## The Problem

This context misalignment manifests in several ways:

**Inconsistent Implementation**: Without access to the full context and reasoning behind previous decisions, AI suggestions may contradict established patterns or architectural choices.

**Knowledge Silos**: Critical decisions and their rationale remain trapped in ephemeral conversations or, worse, only in the developer's mind, making it difficult for team members (and the AI) to understand the "why" behind implementation choices.

**Progress Fragmentation**: Development becomes a series of disconnected interactions rather than a coherent journey, making it challenging to maintain momentum across sessions.

The cost of this misalignment grows as development continues. Code reviews become more difficult, onboarding new team members takes longer, and the AI becomes less effective as a collaborator rather than more effective over time. What starts as minor friction eventually creates significant drag on development velocity.

## Solution

The solution lies in creating an external, persistent shared context that both humans and AI can access and update. This is the core principle behind the Breadcrumb Protocol – a structured workflow built on three key themes:

**1. Structured Planning & Task Management:**
Breaking complex goals into well-defined phases and actionable tasks with clear success criteria. This approach provides AI with clear, manageable units of work, reducing ambiguity and allowing it to focus its generation capabilities effectively.

**2. Centralized & Accessible Knowledge Context:**
Establishing designated locations with consistent naming conventions for project-related information, including domain knowledge and specifications. This makes it easier for the AI to access and utilize the "ground truth" of your project.

**3. Living Documentation & Shared Understanding:**
Maintaining a dynamic, collaborative record of the development process that acts as an external, persistent memory for both the developer and the AI assistant.

The Breadcrumb Protocol implements these themes through a simple yet powerful concept: a shared scratch pad that allows both the developer and AI to align their vision at all times. Each development task gets its own "breadcrumb" file - a single source of truth that tracks progress from requirements through implementation.

> This approach is called [`Breadcrumb Protocol`](https://github.com/dasiths/VibeCodingBreadcrumbDemo) and is hosted on GitHub.

<a href="https://github.com/dasiths/VibeCodingBreadcrumbDemo"><img src="/assets/images/breadcrumb-protocol.png" alt="Breadcrumb Protocol" width="200"/></a>

## Using the `Breadcrumb Protocol`

The Breadcrumb Protocol centres around the concept of a breadcrumb file - a shared documentation file that serves as a collaborative scratch pad between the developer and the AI agent. Rather than relying on AI to maintain perfect context awareness across multiple interactions, this approach externalizes the context so both parties can refer to and update it continuously.

<div style="width:560px; height:315px; overflow:hidden; margin:auto;">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/etYG-6-9Mlk?si=Pvr1IbPHGEaKjuBV" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

![Workflow](https://github.com/dasiths/VibeCodingBreadcrumbDemo/blob/main/image.png?raw=true)

See the [full prompt](https://github.com/dasiths/VibeCodingBreadcrumbDemo/blob/main/.github/copilot-instructions.md) for more details.

Let's look at how it works in practice.

1. **Development Workflow Start**:

   For a new task, you prompt the AI agent with clear instructions. For example:
   ```text
   Help me create a aspnet api project according to the spec. I don't need the database context just yet so we can return a hardcoded response from the request processor.

   Location: src/backend/
   Solution name: CarRental
   Project name: CarRental.Api

   Use dotnet 9. Use this document on instructions of how to add swagger/openapi endpoint. https://devblogs.microsoft.com/dotnet/dotnet9-openapi/
   ```

   The system prompt for the agent includes details about the domain knowledge, specifications and the breadcrumb protocol.

2. **Agent Create a Breadcrumb File**:

   At the start of each task, a breadcrumb file is created in `.github/.copilot/breadcrumbs` with the format `yyyy-mm-dd-HHMM-{title}.md`.

   Each breadcrumb includes mandatory sections:
   - **Requirements**: Clear list of what needs to be implemented.
   - **Additional comments from user**: Any additional input during the conversation.
   - **Plan**: Strategy and technical plan before implementation.
   - **Decisions**: Why specific implementation choices were made.
   - **Implementation Details**: Code snippets with explanations for key files.
   - **Changes Made**: Summary of files modified and how they changed.
   - **Before/After Comparison**: Highlighting the improvements.
   - **References**: List of referred material like domain knowledge files and specifications.

3. **Agent Follows the Workflow Rules**:
   - Update the breadcrumb **BEFORE** making any code changes.
   - **Get explicit approval** on the plan before implementation.
   - Update the breadcrumb **AFTER completing each significant change**.
   - Keep the breadcrumb as the single source of truth for the task's context and progress.

4. **Agent Creates and Follows Structured Plans**:
   - Organize plans into numbered phases (e.g., "Phase 1: Setup Dependencies")
   - Break down each phase into specific tasks with numeric identifiers
   - Include a detailed checklist that maps to all phases and tasks
   - Reference domain knowledge/specs from the appropriate folders
   - Mark tasks as `- [ ]` for pending tasks and `- [x]` for completed tasks
   - Define clear success criteria for the implementation

5. **User Provides Feedback**:
   - Validate the agent generated plans are accurate.
   - Review code changes proposed by the agent.
   - Provide input in form of sample code or additional context.
   - Iterate the steps.

This approach transforms how developers and AI agents collaborate by creating a shared mental model that evolves with the project. The breadcrumb creates a feedback loop where each party can verify their understanding against the single source of truth, dramatically reducing misalignments and ensuring consistent implementation.

## Repository Structure

The protocol is implemented through a focused directory structure that serves as the external memory system for your project. The `.github/.copilot/` directory becomes the central nervous system for AI collaboration:

```text
.github/.copilot/
├── breadcrumbs/
│   ├── 2025-04-13-0130-car-rental-entity-model.md
│   ├── 2025-04-13-0135-aspnet-core-api-specification.md
│   └── 2025-04-13-1723-car-rental-api-setup.md
│
├── domain_knowledge/
│   └── entities/
│       └── car-rental-entities.md
│
└── specifications/
    ├── application_architecture/
    │   └── aspnet-core-minimal-api.spec.md
    └── .template.md
```

This structure implements the three key themes of the protocol:

* **Domain Knowledge Integration:** 
  * The agent uses files within `.github/.copilot/domain_knowledge` as the authoritative source for understanding the project's context, entities, workflows, and language.
  * This centralized knowledge base grows and evolves as the project develops, ensuring that both humans and AI work from the same foundational understanding.

* **Specification Adherence:**
  * The agent refers to specification files located in `.github/.copilot/specifications` to guide implementation.
  * By externalizing specifications in a consistent location and format, implementation details remain aligned with project goals regardless of which developer or AI interaction is involved.

* **Breadcrumb Files:**
  * Stored in `.github/.copilot/breadcrumbs` with a specific naming format that includes timestamp and topic.
  * Each file serves as a living document of task progression, capturing the evolution of requirements, decisions, and implementations in a format that's accessible to both AI and human collaborators.

## Conclusion

The Breadcrumb Protocol addresses a fundamental challenge in AI-assisted development: maintaining shared context alignment between developers and AI assistants. By externalizing the mental model into a structured, collaborative format, it transforms how teams work with AI tools like GitHub Copilot.

This approach delivers several key benefits:

* **Contextual Continuity**: Each interaction builds on previous ones through the shared external memory system, allowing AI to generate more relevant and consistent suggestions.

* **Team Alignment**: All developers (and their AI assistants) work from the same documented understanding, reducing inconsistencies and knowledge silos.

* **Accelerated Review Process**: Code reviews become more efficient as reviewers can trace the reasoning behind implementation choices through the breadcrumb documentation.

* **Evolving Knowledge Base**: The domain knowledge and specification repositories become increasingly valuable project assets that improve AI assistance over time.

* **Reduced Context Switching**: Developers spend less time re-explaining project details to AI, focusing instead on solving the actual problems at hand.

The protocol provides a practical framework for truly collaborative AI development that acknowledges both the strengths and limitations of current AI assistants. Rather than expecting perfect memory from AI systems, it creates a shared external memory that both parties can rely on and contribute to.

You can find the complete documentation and example implementation in the [GitHub repo](https://github.com/dasiths/VibeCodingBreadcrumbDemo).

Please leave any comments or feedback here. If you have ideas for improving the protocol, please raise a pull request on GitHub. Thank you.
