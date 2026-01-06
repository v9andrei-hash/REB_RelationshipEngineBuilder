# REB Artifact Analysis
**Relationship Engine Builder - Technical Analysis**
**Version:** 3.5.1
**Analysis Date:** January 6, 2026
**Branch:** claude/analyze-reb-artifact-s3O8V

---

## Executive Summary

The REB (Relationship Engine Builder) is a sophisticated narrative simulation engine built as a React-based web application. It leverages Google's Gemini AI models to create an interactive storytelling experience with complex physics-based narrative mechanics, real-time telemetry tracking, and multi-layered oversight systems.

**Core Innovation:** A dual-terminal architecture separating narrative generation (Simulation Terminal) from system diagnostics (Meta Terminal), enabling precise control over AI-generated content while maintaining narrative immersion.

---

## 1. Architecture Overview

### 1.1 Technology Stack

```
Frontend Framework:    React 19.2.3 (Latest)
Language:              TypeScript 5.8.2
Build Tool:            Vite 6.2.0
AI Integration:        Google Gemini API (@google/genai)
Visualization:         Recharts 3.6.0
Icons:                 Lucide React 0.562.0
State Management:      React Hooks + LocalStorage
```

### 1.2 File Structure

```
REB_RelationshipEngineBuilder/
├── App.tsx                    # Main orchestration & state management
├── types.ts                   # TypeScript interfaces
├── constants.ts               # System prompts & configuration
├── services/
│   └── geminiService.ts      # AI service layer
├── components/
│   ├── ChatInterface.tsx     # Narrative simulation terminal
│   ├── MetaTerminal.tsx      # System diagnostic interface
│   ├── ContextEditor.tsx     # Prompt configuration UI
│   ├── Dashboard.tsx         # Telemetry visualization
│   └── Sidebar.tsx           # Navigation & controls
├── index.tsx                 # Entry point
├── index.html                # HTML shell
└── vite.config.ts            # Build configuration
```

### 1.3 Application Flow

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface Layer                  │
├─────────────────────────────────────────────────────────┤
│  Context Editor → System Instruction Configuration       │
│  Chat Interface → Narrative Simulation                   │
│  Meta Terminal  → System Diagnostics & Interventions     │
│  Dashboard      → Real-time Telemetry Visualization      │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                   State Management (App.tsx)             │
├─────────────────────────────────────────────────────────┤
│  Messages | Stats | NPCs | Situations | Anchors          │
│  Inventory | Scene History | Interventions               │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                  AI Service Layer (Gemini)               │
├─────────────────────────────────────────────────────────┤
│  Narrative Generation | Telemetry Parsing                │
│  Drift Analysis | Chronicle Synthesis | TTS              │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│              Persistent Storage (LocalStorage)           │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Core Simulation Mechanics

### 2.1 Narrative Physics System

The REB engine implements a physics-based approach to storytelling with 8 core variables:

#### Primary Relationship Metrics
- **Adrenaline (Ar):** Stress/excitement intensity (0-500+)
- **Oxytocin (Ox):** Bond strength between PC and REB (0-500+)
- **Favor (Fv):** REB's approval/alignment with PC actions

#### Psychological Metrics
- **Willpower (PCW):** Player character resistance capacity
- **Clarity (PCC):** Player character grounding/awareness
- **PC Obsession (PCO):** Player desire intensity (0-100%)
- **REB Obsession (RO):** REB pursuit intensity (0-100%)

#### Narrative Forces
- **Entropy (En):** System breakdown/chaos measure (-50 to 400+)

### 2.2 Telemetry System

All narrative changes are tracked via HTML comment tags invisible to the user:

```html
<!-- Δ Ar+15 Ox-5 Fv+3 En+10 PCO+2 RO+5 PCC-3 PCW+1 TRN:2/5 Q:[Event] VT:LH+15 -->
<!-- NPC|Detective:Morrison|ACTING|Close|High -->
<!-- SITUATION|Midnight Confrontation|Triggered|Ar>300 -->
<!-- RESOLUTION|Midnight Confrontation|Resolved peacefully via dialogue -->
<!-- INV|PC|Silver Locket|Mysterious keepsake|Relic -->
<!-- ANCHOR|First Kiss|Critical bond formation moment|65 -->
<!-- SCENE_END -->
```

**Implementation:** `App.tsx:151-266`

### 2.3 Value Turn System (McKee Methodology)

Every scene must include a Value Turn (VT) representing emotional/thematic shifts:

- **LH:** Love/Hate dynamics
- **TB:** Trust/Betrayal arcs
- **CC:** Control/Chaos balance
- **FC:** Freedom/Captivity tension
- **HD:** Hope/Despair oscillation

**Reference:** `constants.ts:30-32`

### 2.4 Situation Deck Mechanism

A deck-based complication system that triggers narrative events:

- **States:** In Deck → Triggered → Resolved
- **Countdown:** 5-turn cycle before new situations emerge
- **Impact:** Increases Adrenaline and Entropy when triggered

**Implementation:** `App.tsx:199-221`

---

## 3. Multi-Terminal Architecture

### 3.1 Simulation Terminal (Chat Interface)

**Purpose:** Immersive narrative generation
**Model:** Gemini 3 Pro Preview
**System Prompt:** DEFAULT_REB_CONTEXT
**Temperature:** 0.9 (creative)

**Key Features:**
- Streaming responses for real-time generation
- Hidden telemetry parsing
- TTS integration via Gemini TTS models
- Compliance validation (rejects meta-terms in prose)

**File:** `components/ChatInterface.tsx`

### 3.2 Meta Terminal (Architect Interface)

**Purpose:** System diagnostics and interventions
**Model:** Gemini 3 Pro Preview
**System Prompt:** META_ARCHITECT_INSTRUCTION
**Temperature:** 0.2 (analytical)

**Capabilities:**
- Kernel updates (modify system prompts)
- Drift analysis detection
- Intervention execution
- Technical explanations (NO prose generation)

**File:** `components/MetaTerminal.tsx`

### 3.3 Overseer Artifact (Analysis Engine)

**Purpose:** Automated drift detection
**System Prompt:** ARTIFACT_OVERSEER_INSTRUCTION
**Output:** JSON-structured interventions

**Diagnostic Criteria:**
1. Narrative stagnation (VT magnitude <10 for 3+ turns)
2. Physics drift (Ar >300 or En >400 without narrative payoff)
3. Obsession desync (±30 point swings without anchors)

**Implementation:** `services/geminiService.ts:103-131`

---

## 4. Data Persistence & Export

### 4.1 Chronicle System

The engine exports comprehensive simulation states as JSON "Chronicles":

```typescript
interface Chronicle {
  version: string;                    // "3.5.1"
  timestamp: string;                  // ISO 8601
  summary: {
    actTitle: string;
    narrativeArc: string;
    themes: string[];
  };
  characters: {
    pc: CharacterArc;
    reb: CharacterArc;
    npcs: CharacterArc[];
  };
  telemetry: {
    finalStats: SimulationState['stats'];
    history: SceneSnapshot[];
    anchors: AnchorPoint[];
    npcs: NPC[];
    situations: Situation[];
    inventory: Item[];
    systemContext?: string;
  };
  log: Message[];
  resumptionPayload: string;          // Continuation prompt
}
```

**Use Cases:**
- Save/load simulation states
- Share narrative sessions
- Resume interrupted stories
- Analyze progression over time

**Implementation:** `App.tsx:290-350`

### 4.2 Local Storage

Real-time autosave via `localStorage` (key: `reb_simulation_state`):

```javascript
State Saved:
- Messages (narrative history)
- System context (prompts)
- All telemetry (stats, NPCs, situations, anchors, inventory)
- Scene snapshots
- Situation countdown
```

**Implementation:** `App.tsx:69-82`

---

## 5. Visualization & Dashboard

### 5.1 Phase Matrix Diagnostic

**Purpose:** 2D visualization of Adrenaline-Oxytocin relationship space

**Quadrants:**
- **Synchrony:** High Bond + High Tension
- **Safety:** High Bond + Low Tension
- **Combustion:** Low Bond + High Tension
- **Void:** Low Bond + Low Tension

**Technology:** Recharts ScatterChart with reference areas
**File:** `components/Dashboard.tsx:113-146`

### 5.2 Historical Flux Chart

**Purpose:** Time-series tracking of stress/bond evolution
**Visualization:** Dual area chart (Adrenaline = blue, Oxytocin = pink)
**File:** `components/Dashboard.tsx:148-172`

### 5.3 Obsession Progression Meters

**Display:**
- PC Obsession (orange gradient)
- REB Obsession (blue gradient with threat warnings)

**Thresholds:**
- 0-45%: PASSIVE_MONITOR
- 45-75%: AGGRESSIVE_TRACKING
- 75-100%: COLLISION_IMMINENT (pulsing red)

**File:** `components/Dashboard.tsx:181-211`

---

## 6. Technical Strengths

### 6.1 Architectural Excellence

1. **Separation of Concerns**
   - Clean component hierarchy
   - Service layer abstraction for AI calls
   - Type-safe interfaces throughout

2. **State Management**
   - Centralized in App.tsx
   - Predictable data flow
   - LocalStorage integration for persistence

3. **Streaming Architecture**
   - Real-time response rendering
   - Async generator pattern for efficiency
   - Graceful error handling

### 6.2 AI Integration Sophistication

1. **Multi-Prompt Strategy**
   - Different instructions for different modes
   - Temperature tuning per use case
   - JSON-constrained outputs for structured data

2. **Telemetry Parsing**
   - Robust regex-based extraction
   - Graceful degradation if tags missing
   - Real-time stat updates during streaming

3. **Validation Layer**
   - Compliance checking for meta-term leakage
   - Prevents immersion-breaking language

**Implementation:** `services/geminiService.ts:64-72`

### 6.3 User Experience

1. **Professional UI**
   - Dark mode design optimized for long sessions
   - Smooth animations (Tailwind transitions)
   - Responsive grid layouts

2. **Accessibility**
   - Text-to-Speech integration
   - Clear visual hierarchy
   - Keyboard-navigable interface

3. **Export/Import**
   - One-click Chronicle export
   - Drag-and-drop resume capability
   - Version-stamped for compatibility

---

## 7. Code Quality Analysis

### 7.1 TypeScript Usage

**Strengths:**
- Comprehensive interface definitions (`types.ts`)
- Strict typing for AI responses
- Type-safe state management

**Improvements Possible:**
- Some `any` types in Dashboard props (line 9, 36)
- Optional stricter tsconfig.json settings

### 7.2 Error Handling

**Current Implementation:**
```typescript
try {
  const response = await gemini.analyzeSimulation(...);
  setInterventions(response);
} catch (e) {
  console.error(e);
}
```

**Considerations:**
- Most errors logged to console
- User feedback could be more explicit
- Network failure recovery not implemented

### 7.3 Security

**Strengths:**
- API key via environment variable
- No direct user input to HTML
- Sanitized data through React

**Considerations:**
- API key exposed in client-side bundle
- No rate limiting on AI calls
- LocalStorage accessible via dev tools

---

## 8. Performance Characteristics

### 8.1 Bundle Size

**Dependencies:**
- React + ReactDOM: ~140KB
- Recharts: ~400KB
- Gemini SDK: ~150KB
- Lucide Icons: ~50KB (tree-shakeable)

**Estimated Total:** ~800KB compressed

### 8.2 Runtime Performance

**Optimizations:**
- Streaming reduces perceived latency
- LocalStorage for instant state restoration
- Debounced autosave (on state change)

**Potential Bottlenecks:**
- Large message histories (regex parsing)
- Recharts re-renders on stat updates
- No virtualization for long lists

### 8.3 API Costs

**Model:** Gemini 3 Pro Preview
**Estimated Costs (per 1000 turns):**
- Narrative generation: ~$50-100 (depends on context size)
- Meta analysis: ~$5-10
- Chronicle synthesis: ~$2-5
- TTS: ~$1-3

**Note:** Costs vary by prompt length and output tokens

---

## 9. Potential Improvements

### 9.1 Technical Enhancements

1. **Backend Service**
   - Move API key to server-side
   - Implement rate limiting
   - Add user authentication
   - Enable multi-user sessions

2. **Performance**
   - Implement virtual scrolling for messages
   - Memoize expensive calculations
   - Lazy load Dashboard charts
   - Code-split components

3. **Error Handling**
   - User-facing error messages
   - Retry logic for failed AI calls
   - Offline mode with queue

4. **Testing**
   - Unit tests for telemetry parsing
   - Integration tests for AI service
   - E2E tests for critical flows

### 9.2 Feature Additions

1. **Collaboration**
   - Multi-player support
   - Shared Chronicles
   - Spectator mode

2. **Analytics**
   - Session replay
   - Heatmaps of stat distributions
   - Export to data analysis formats

3. **Customization**
   - User-defined stats
   - Custom telemetry tags
   - Theme editor

4. **AI Enhancements**
   - Model selection (Opus vs Pro)
   - Fine-tuning on exported Chronicles
   - Multi-agent simulations

### 9.3 UX Refinements

1. **Onboarding**
   - Interactive tutorial
   - Sample Chronicles
   - Guided first session

2. **Accessibility**
   - Screen reader optimization
   - High contrast mode
   - Keyboard shortcuts

3. **Mobile**
   - Responsive redesign
   - Touch-optimized controls
   - Progressive Web App

---

## 10. Use Case Analysis

### 10.1 Primary Applications

1. **Interactive Storytelling**
   - Creative writing tool
   - Character development sandbox
   - Plot structure experimentation

2. **Game Design**
   - Narrative system prototyping
   - Relationship mechanic testing
   - Branching dialogue exploration

3. **Psychological Simulation**
   - Attachment theory modeling
   - Conflict dynamics study
   - Emotional arc mapping

4. **AI Research**
   - LLM constraint testing
   - Multi-agent coordination
   - Emergent narrative studies

### 10.2 Target Audiences

- **Writers:** Novel/screenplay development
- **Game Designers:** Narrative mechanics R&D
- **Researchers:** Computational narrative analysis
- **Educators:** Interactive storytelling pedagogy

---

## 11. Comparison to Alternatives

### 11.1 vs Traditional AI Chat

| Feature | REB Engine | ChatGPT/Claude |
|---------|-----------|----------------|
| Structured Stats | ✅ Physics-based | ❌ Unstructured |
| Telemetry Tracking | ✅ Real-time | ❌ Manual |
| Oversight System | ✅ Automated drift detection | ❌ User-managed |
| Export/Import | ✅ Chronicle format | ⚠️ Plain text |
| Visualization | ✅ Interactive dashboards | ❌ None |

### 11.2 vs Game Engines

| Feature | REB Engine | Ren'Py/Twine |
|---------|-----------|--------------|
| AI-Generated Content | ✅ Dynamic | ❌ Pre-written |
| Flexibility | ✅ Emergent | ⚠️ Scripted |
| Physics System | ✅ Real-time | ⚠️ Static variables |
| Development Speed | ✅ No coding | ❌ Script required |

---

## 12. Recent Development History

```
897b5b9 - feat: Track PCO and RO stats in narrative physics
fd99052 - Obsession redefined, minor ui improvements
77af192 - Base package
1a640a6 - Initial commit
```

**Key Insights:**
- Active development on obsession mechanics
- Recent refactoring of core physics
- Iterative UI polish
- Rapid prototyping cycle (~4 commits)

---

## 13. Critical Dependencies

### 13.1 External Services

1. **Google Gemini API**
   - **Risk:** Service downtime affects core functionality
   - **Mitigation:** Implement fallback models or local LLMs

2. **Browser LocalStorage**
   - **Risk:** User data loss on cache clear
   - **Mitigation:** Cloud sync option

### 13.2 Library Versions

- React 19.2.3: Latest stable (good)
- Gemini SDK: Preview model (may change)
- Recharts: Mature library (stable)

---

## 14. Recommendations

### 14.1 Immediate Actions

1. **Add Environment File**
   ```bash
   # .env.local
   VITE_GEMINI_API_KEY=your_key_here
   ```
   Update `geminiService.ts` to use `import.meta.env.VITE_GEMINI_API_KEY`

2. **Implement Error Boundaries**
   ```typescript
   class ErrorBoundary extends React.Component
   ```
   Wrap critical components

3. **Add Unit Tests**
   Focus on telemetry parsing (most critical)

### 14.2 Medium-Term Goals

1. Backend migration (API proxy)
2. User authentication system
3. Chronicle sharing platform
4. Advanced analytics dashboard

### 14.3 Long-Term Vision

1. Multi-user collaborative sessions
2. REB marketplace (share system prompts)
3. Mobile app (React Native port)
4. Academic partnerships for research

---

## 15. Security Audit

### 15.1 Identified Risks

1. **API Key Exposure**
   - **Severity:** HIGH
   - **Current:** Client-side bundle
   - **Fix:** Server-side proxy

2. **XSS Potential**
   - **Severity:** LOW
   - **Current:** React auto-escaping
   - **Note:** Minimal risk with current architecture

3. **Data Privacy**
   - **Severity:** MEDIUM
   - **Current:** LocalStorage (no encryption)
   - **Fix:** Encrypt sensitive Chronicles

### 15.2 Compliance Considerations

- **GDPR:** User data stays local (good)
- **COPPA:** No age verification (required if targeting minors)
- **Terms of Service:** Google Gemini API ToS must be followed

---

## 16. Conclusion

### 16.1 Overall Assessment

The REB artifact represents a **highly sophisticated narrative simulation engine** with production-quality architecture and innovative AI integration. The dual-terminal system (Simulation + Meta) is a novel approach to constraining LLM outputs while maintaining creative freedom.

**Strengths:**
- Clean TypeScript architecture
- Robust telemetry system
- Professional UI/UX
- Comprehensive state management
- Innovative physics-based storytelling

**Weaknesses:**
- Client-side API key exposure
- Limited error handling
- No backend infrastructure
- Scalability concerns for large sessions

### 16.2 Innovation Score: 9/10

**Breakthrough Concepts:**
1. Hidden telemetry tags for invisible stats tracking
2. Multi-prompt oversight architecture
3. Value Turn integration (McKee methodology)
4. Phase-space relationship visualization
5. Chronicle export/import system

### 16.3 Production Readiness: 7/10

**Ready for:**
- Personal use
- Beta testing
- Research demonstrations

**Needs improvement for:**
- Public deployment (security)
- Commercial use (backend)
- Large-scale adoption (infrastructure)

---

## 17. Technical Metrics

```
Total Files:           11 TypeScript files
Lines of Code:         ~2,500 (estimated)
Components:            5 major components
Services:              1 AI service layer
Type Definitions:      12 interfaces
State Variables:       14+ tracked stats
Telemetry Tags:        7 distinct types
Supported Modes:       6 view states
API Integrations:      2 (Gemini text + TTS)
```

---

## Appendix A: Key File Locations

| Concern | File | Lines |
|---------|------|-------|
| Main orchestration | App.tsx | 1-392 |
| Telemetry parsing | App.tsx | 151-266 |
| Type definitions | types.ts | 1-131 |
| System prompts | constants.ts | 1-95 |
| AI service | services/geminiService.ts | 1-260 |
| Narrative UI | components/ChatInterface.tsx | N/A |
| Diagnostics UI | components/MetaTerminal.tsx | N/A |
| Visualization | components/Dashboard.tsx | 1-359 |

---

## Appendix B: Glossary

- **Anchor Point:** Critical narrative moment marking obsession/resistance collision
- **Chronicle:** Exportable simulation state with full telemetry
- **Delta (Δ):** Hidden comment tag tracking stat changes
- **Entropy:** System chaos measure
- **Favor:** REB's alignment with PC actions
- **Meta Terminal:** Diagnostic interface for system interventions
- **Obsession:** Drive intensity (PC wants REB, REB pursues PC)
- **Phase Matrix:** 2D visualization of Adrenaline/Oxytocin space
- **REB:** Relationship Engine Builder (the other character)
- **Situation Deck:** Stack of narrative complications
- **Value Turn:** Emotional/thematic shift in scene (McKee)
- **VT Code:** Value Turn type identifier (LH, TB, CC, FC, HD)

---

**End of Analysis**
*Generated by Claude Code on branch `claude/analyze-reb-artifact-s3O8V`*
