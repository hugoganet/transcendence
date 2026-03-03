# User Journey Flows — transcendence

## Journey 1: First-Time User (Onboarding → First Mission)

```mermaid
flowchart TD
    A[Landing Page] --> B{Sign Up Method}
    B -->|Google OAuth| C[One-Click Auth]
    B -->|Email/Password| D[Create Account Form]
    C --> E[Welcome Screen]
    D --> E

    E --> F["Micro-Onboarding<br/>(1 screen: 'What brings you here?'<br/>Invest / Understand / Curiosity)"]
    F --> G[Home Screen<br/>Next Mission: 'What is a Blockchain?']
    G --> H[Tap 'Start Mission']

    H --> I["Mission Intro Card<br/>(1-2 sentence context setter)"]
    I --> J[Exercise 1: Interactive Placement<br/>Drag blocks into chain order]
    J --> K{Answer Submitted}
    K -->|Correct| L["Calm Confirmation ✓<br/>+Brief explanation<br/>(XP only — no tokens yet)"]
    K -->|Incorrect| M["Neutral Feedback<br/>+Why it was wrong<br/>+Try again prompt"]
    M --> J

    L --> N{More Exercises<br/>in Mission?}
    N -->|Yes| O[Next Exercise<br/>Seamless transition]
    O --> K
    N -->|No| P["Mission Complete Screen<br/>XP: +1 | Concept learned<br/>'Continue' or 'Curriculum Map'"]

    P --> Q{User Choice}
    Q -->|Continue| R[Next Mission Starts]
    Q -->|Curriculum Map| S[Curriculum Map View]
    Q -->|Close App| T[Session End<br/>Progress Saved]

    style A fill:#f0f7f7,stroke:#2B9E9E
    style E fill:#f0f7f7,stroke:#2B9E9E
    style P fill:#fdf6e8,stroke:#D4A843
    style L fill:#e8f5e8,stroke:#4a9
    style M fill:#fef0ed,stroke:#d88
```

---

## Journey 2: Daily Session (Return → Mission → Chain)

```mermaid
flowchart TD
    A[Open App] --> B[Home Screen<br/>Next Mission surfaced<br/>Streak visible]
    B --> C[Tap 'Start Mission']

    C --> D[Mission Intro Card<br/>1-2 sentence context]
    D --> E[Exercise Flow<br/>2-5 minutes]
    E --> F{Mission Complete}

    F --> G["Mission Complete Screen<br/>XP +1 | Tokens earned*<br/>Gas spent summary*<br/>(*if mechanics activated)"]

    G --> H{User Choice}
    H -->|"'Continue' (1 tap)"| I[Next Mission Starts<br/>Seamless chain]
    H -->|Curriculum Map| J[Browse Curriculum]
    H -->|Close App| K[Session End]

    I --> D

    J --> L{Select Mission}
    L -->|Available Mission| D
    L -->|Locked Mission| M[Shows prerequisite<br/>needed]

    subgraph "Gentle Break Suggestion"
        N["After 3+ chained missions:<br/>'Nice session! Take a break<br/>or keep going?'"]
    end

    I -->|3+ missions| N
    N -->|Keep Going| D
    N -->|Done| K

    style B fill:#f0f7f7,stroke:#2B9E9E
    style G fill:#fdf6e8,stroke:#D4A843
    style N fill:#f0f7f7,stroke:#2B9E9E
```

---

## Journey 3: Progressive Mechanic Reveal (XP → Tokens → Gas → Wallet)

```mermaid
flowchart TD
    subgraph "Phase 1: XP Only (Early Missions)"
        A1[Complete Mission] --> A2["Mission Complete:<br/>XP +1<br/>Simple, clean, no clutter"]
        A2 --> A3["Home Screen:<br/>XP counter visible<br/>No token balance shown"]
    end

    subgraph "Phase 2: Tokens Introduced (Curriculum teaches tokens)"
        B0["Curriculum Milestone:<br/>'What are crypto tokens?'<br/>mission completed"] --> B1["✨ Reveal Moment ✨<br/>'You've been earning<br/>Knowledge Tokens!'"]
        B1 --> B2["Token balance appears<br/>on Home + Mission Complete<br/>Retroactive count shown"]
        B2 --> B3["Brief explanation:<br/>'Tokens are digital assets.<br/>You now own some.'"]
    end

    subgraph "Phase 3: Gas Fees Activated (Curriculum teaches gas)"
        C0["Curriculum Milestone:<br/>'What are gas fees?'<br/>mission completed"] --> C1["✨ Reveal Moment ✨<br/>'Every action on a blockchain<br/>costs gas — even yours.'"]
        C1 --> C2["Gas indicator appears<br/>on exercise submissions<br/>Each submit costs tokens"]
        C2 --> C3["User experiences gas:<br/>correct = 1 gas cost<br/>incorrect = 1 gas cost + resubmit"]
    end

    subgraph "Phase 4: Wallet-Profile (Curriculum teaches wallets)"
        D0["Curriculum Milestone:<br/>'What is a crypto wallet?'<br/>mission completed"] --> D1["✨ Reveal Moment ✨<br/>'Your profile has been<br/>a wallet all along.'"]
        D1 --> D2["Profile transforms:<br/>Token balance (large, centered)<br/>Transaction history<br/>Learning portfolio"]
        D2 --> D3["User realizes:<br/>XP = activity history<br/>Tokens = wallet balance<br/>Gas = transaction costs"]
    end

    A3 --> B0
    B3 --> C0
    C3 --> D0

    style B1 fill:#fdf6e8,stroke:#D4A843
    style C1 fill:#fdf6e8,stroke:#D4A843
    style D1 fill:#fdf6e8,stroke:#D4A843
```

---

## Journey 4: Drop-off & Return

```mermaid
flowchart TD
    A["User Opens App<br/>(after absence)"] --> B{How long<br/>since last visit?}

    B -->|"1-3 days"| C["Home Screen (normal)<br/>Streak shows current count<br/>Next mission surfaced"]
    B -->|"4-14 days"| D["Welcome Back Screen<br/>'Your progress is safe'"]
    B -->|"14+ days"| E["Extended Welcome Back<br/>'Here's everything you've earned'"]

    D --> F["Progress Summary:<br/>'14 missions completed<br/>3 modules mastered<br/>42 Knowledge Tokens earned'"]
    E --> F

    F --> G["Resume Point:<br/>'Pick up from: Smart Contracts Basics'<br/>+ brief concept refresher offer"]

    G --> H{User Choice}
    H -->|Start Mission| I[Resume mission flow]
    H -->|Quick Refresher| J["1-2 min review exercise<br/>of previous module concepts"]
    H -->|Curriculum Map| K[Browse full progress]

    J --> I
    C --> I

    I --> L[Normal Mission Flow<br/>Same as Journey 2]

    style D fill:#f0f7f7,stroke:#2B9E9E
    style E fill:#f0f7f7,stroke:#2B9E9E
    style F fill:#fdf6e8,stroke:#D4A843
```

---

## Journey 5: Curriculum Navigation

```mermaid
flowchart TD
    A[Tap 'Curriculum'<br/>in Bottom Nav] --> B["Curriculum Map View<br/>Vertical scrolling path<br/>Khan Academy-inspired"]

    B --> C["Modules shown as nodes:<br/>🟢 Completed<br/>🔵 In Progress (current)<br/>⚪ Available (unlocked)<br/>🔒 Locked (prerequisite needed)"]

    C --> D{User taps a node}

    D -->|Completed Module| E["Module Detail:<br/>All missions listed ✓<br/>Review any mission<br/>Module summary"]
    D -->|In-Progress Module| F["Module Detail:<br/>Completed missions ✓<br/>Next mission highlighted<br/>'Continue' button"]
    D -->|Available Module| G["Module Detail:<br/>Mission list preview<br/>Estimated time<br/>'Start Module' button"]
    D -->|Locked Module| H["Lock Overlay:<br/>'Complete [prerequisite]<br/>to unlock this module'<br/>Shows dependency"]

    E --> I{User action}
    I -->|Review Mission| J[Replay completed mission<br/>No XP/tokens earned]
    I -->|Back to Map| B

    F --> K{User action}
    K -->|Continue| L[Start next mission<br/>Normal flow]
    K -->|Back to Map| B

    G --> M{User action}
    M -->|Start Module| L
    M -->|Back to Map| B

    H --> B

    style C fill:#f0f7f7,stroke:#2B9E9E
    style F fill:#fdf6e8,stroke:#D4A843
```
