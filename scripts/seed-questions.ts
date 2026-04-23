/**
 * Seed ~10 real JEE-style questions with reasoning-first solutions.
 *
 * Usage:
 *   npm run seed:questions
 *
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - Curriculum already seeded via /admin/subjects → "Seed JEE Curriculum"
 *
 * Idempotent: for each question, skips insert if a question with the same
 * source + year + question_text prefix already exists.
 */

import { createClient } from "@supabase/supabase-js"

type Option = { id: string; text: string }

type SeedSolution = {
  solution_type:
    | "standard"
    | "logical"
    | "elimination"
    | "shortcut"
    | "trap_warning"
    | "pattern"
  title?: string
  content: string
  steps?: { step_number: number; text: string; explanation?: string }[]
  time_estimate_seconds?: number
  when_to_use?: string
  when_not_to_use?: string
  difficulty_to_execute?: number
  status?: "draft" | "published"
}

type SeedQuestion = {
  subjectSlug: string
  chapterSlug: string
  topicSlug: string
  question_text: string
  question_type: "single_correct" | "multi_correct" | "numerical" | "subjective"
  options?: Option[]
  correct_answer:
    | { type: "single"; value: string }
    | { type: "multi"; values: string[] }
    | { type: "numerical"; value: number; tolerance?: number }
    | { type: "subjective"; value: string }
  difficulty: number
  estimated_time_seconds: number
  source: string
  year: number
  solutions: SeedSolution[]
}

// ---------- Seed data ----------

const SEED: SeedQuestion[] = [
  // 1. Physics — Kinematics (projectile)
  {
    subjectSlug: "physics",
    chapterSlug: "mechanics",
    topicSlug: "kinematics",
    question_text:
      "A projectile is launched from ground level at an angle $\\theta$ with speed $v_0$. The ratio of its horizontal range $R$ to its maximum height $H$ is:",
    question_type: "single_correct",
    options: [
      { id: "a", text: "$2\\tan\\theta$" },
      { id: "b", text: "$4\\cot\\theta$" },
      { id: "c", text: "$4\\tan\\theta$" },
      { id: "d", text: "$\\tan^2\\theta$" },
    ],
    correct_answer: { type: "single", value: "c" },
    difficulty: 2,
    estimated_time_seconds: 90,
    source: "JEE Mains (Sample)",
    year: 2023,
    solutions: [
      {
        solution_type: "standard",
        content:
          "Use the standard projectile formulas: $R = \\dfrac{v_0^2 \\sin 2\\theta}{g}$ and $H = \\dfrac{v_0^2 \\sin^2\\theta}{2g}$.",
        steps: [
          {
            step_number: 1,
            text: "Compute $\\dfrac{R}{H} = \\dfrac{v_0^2 \\sin 2\\theta / g}{v_0^2 \\sin^2\\theta / (2g)}$.",
          },
          {
            step_number: 2,
            text: "Simplify: $\\dfrac{R}{H} = \\dfrac{2\\sin 2\\theta}{\\sin^2\\theta} = \\dfrac{4\\sin\\theta\\cos\\theta}{\\sin^2\\theta} = 4\\cot\\theta$.",
            explanation:
              "Wait — recheck: $\\sin 2\\theta = 2\\sin\\theta\\cos\\theta$, so ratio is $4\\cos\\theta/\\sin\\theta = 4\\cot\\theta$.",
          },
        ],
        time_estimate_seconds: 60,
        status: "published",
      },
      {
        solution_type: "pattern",
        content:
          "Ratios of projectile quantities are always pure trig. Memorize: $\\dfrac{R}{H} = 4\\cot\\theta$. Special case: at $\\theta = 45°$, $R/H = 4$.",
        when_to_use:
          "Any question asking for ratios of R, H, T of a single projectile.",
        status: "published",
      },
      {
        solution_type: "trap_warning",
        content:
          "The trap here is reading the ratio as $R/H = 4\\tan\\theta$. Check the endpoints: at $\\theta = 45°$, $\\tan 45° = 1$ gives $4$ — looks right. But at $\\theta \\to 90°$, $R \\to 0$ while $H$ is large, so $R/H \\to 0$. That rules out $4\\tan\\theta$ (which goes to $\\infty$) and confirms $4\\cot\\theta$.",
        when_to_use:
          "Whenever an option differs only by $\\tan \\leftrightarrow \\cot$, sanity-check an endpoint.",
        status: "published",
      },
    ],
  },

  // 2. Physics — Electrostatics
  {
    subjectSlug: "physics",
    chapterSlug: "electromagnetism",
    topicSlug: "electrostatics",
    question_text:
      "Two point charges $+q$ and $-q$ are placed at $(-a, 0)$ and $(+a, 0)$. The electric field at a point $P = (0, y)$ on the perpendicular bisector has magnitude:",
    question_type: "single_correct",
    options: [
      {
        id: "a",
        text: "$\\dfrac{1}{4\\pi\\varepsilon_0} \\cdot \\dfrac{2qa}{(a^2 + y^2)^{3/2}}$",
      },
      {
        id: "b",
        text: "$\\dfrac{1}{4\\pi\\varepsilon_0} \\cdot \\dfrac{q}{(a^2 + y^2)}$",
      },
      {
        id: "c",
        text: "$\\dfrac{1}{4\\pi\\varepsilon_0} \\cdot \\dfrac{2q}{(a^2 + y^2)^{3/2}}$",
      },
      { id: "d", text: "Zero" },
    ],
    correct_answer: { type: "single", value: "a" },
    difficulty: 3,
    estimated_time_seconds: 150,
    source: "JEE Mains (Sample)",
    year: 2022,
    solutions: [
      {
        solution_type: "standard",
        content:
          "Each charge is at distance $r = \\sqrt{a^2 + y^2}$ from $P$. The $y$-components of the two field vectors cancel; the $x$-components add (both point in $-\\hat{x}$). $E_x = 2 \\cdot \\dfrac{1}{4\\pi\\varepsilon_0}\\dfrac{q}{r^2} \\cdot \\dfrac{a}{r} = \\dfrac{1}{4\\pi\\varepsilon_0} \\dfrac{2qa}{(a^2+y^2)^{3/2}}$.",
        steps: [
          { step_number: 1, text: "Distance from each charge to $P$: $r=\\sqrt{a^2+y^2}$." },
          { step_number: 2, text: "Magnitude from each: $E_0 = \\dfrac{kq}{r^2}$." },
          {
            step_number: 3,
            text: "Component along dipole axis: $E_0 \\cos\\alpha = E_0 \\cdot \\dfrac{a}{r}$. Double it.",
          },
        ],
        status: "published",
      },
      {
        solution_type: "elimination",
        content:
          "Check dimensions and limits. On the perpendicular bisector the field is nonzero (rules out option D). At $y=0$, the exact formula should give the well-known dipole bisector result $E = kp/r^3$ with $p = 2qa$. That matches option A. Options B and C miss the dipole dependence on $a$.",
        when_to_use: "When options share the prefactor but differ in structure.",
        status: "published",
      },
      {
        solution_type: "pattern",
        content:
          "For a dipole of moment $p = 2qa$, the field at a point on the equatorial plane at distance $r$ from the center is $E_{\\text{eq}} = \\dfrac{1}{4\\pi\\varepsilon_0}\\dfrac{p}{r^3}$, directed anti-parallel to the dipole axis. Here $r = \\sqrt{a^2+y^2}$.",
        status: "published",
      },
    ],
  },

  // 3. Physics — Photoelectric
  {
    subjectSlug: "physics",
    chapterSlug: "modern-physics",
    topicSlug: "dual-nature",
    question_text:
      "Light of frequency $1.5 \\nu_0$ (where $\\nu_0$ is the threshold frequency) is incident on a metal. What is the ratio of the maximum kinetic energy of photoelectrons to the work function?",
    question_type: "single_correct",
    options: [
      { id: "a", text: "$1/2$" },
      { id: "b", text: "$1$" },
      { id: "c", text: "$3/2$" },
      { id: "d", text: "$2$" },
    ],
    correct_answer: { type: "single", value: "a" },
    difficulty: 2,
    estimated_time_seconds: 90,
    source: "JEE Mains (Sample)",
    year: 2021,
    solutions: [
      {
        solution_type: "standard",
        content:
          "Einstein's photoelectric equation: $K_{\\max} = h\\nu - \\phi$, with $\\phi = h\\nu_0$. Substitute $\\nu = 1.5\\nu_0$: $K_{\\max} = 1.5 h\\nu_0 - h\\nu_0 = 0.5 h\\nu_0 = \\phi/2$. Therefore $K_{\\max}/\\phi = 1/2$.",
        status: "published",
      },
      {
        solution_type: "shortcut",
        content:
          "Drop units: $K_{\\max}/\\phi = (\\nu/\\nu_0) - 1$. For $\\nu/\\nu_0 = 1.5$, the answer is $0.5$.",
        when_to_use:
          "Any photoelectric ratio question — convert everything to multiples of $\\nu_0$.",
        status: "published",
      },
      {
        solution_type: "trap_warning",
        content:
          "Common mistake: treating $\\phi$ as $h\\nu$ instead of $h\\nu_0$. The work function is tied to threshold frequency, not incident frequency.",
        status: "published",
      },
    ],
  },

  // 4. Physics — Rotational Motion
  {
    subjectSlug: "physics",
    chapterSlug: "mechanics",
    topicSlug: "rotational-motion",
    question_text:
      "A thin uniform ring of mass $M$ and radius $R$ rotates about an axis passing through a point on its rim and perpendicular to its plane. The moment of inertia is:",
    question_type: "single_correct",
    options: [
      { id: "a", text: "$MR^2$" },
      { id: "b", text: "$\\dfrac{3}{2}MR^2$" },
      { id: "c", text: "$2MR^2$" },
      { id: "d", text: "$\\dfrac{1}{2}MR^2$" },
    ],
    correct_answer: { type: "single", value: "c" },
    difficulty: 2,
    estimated_time_seconds: 75,
    source: "JEE Mains (Sample)",
    year: 2020,
    solutions: [
      {
        solution_type: "standard",
        content:
          "Moment of inertia of a ring about its central axis (perpendicular to plane, through center) is $I_{\\text{cm}} = MR^2$. Using the parallel axis theorem with displacement $d = R$: $I = I_{\\text{cm}} + Md^2 = MR^2 + MR^2 = 2MR^2$.",
        steps: [
          { step_number: 1, text: "Identify $I_{\\text{cm}} = MR^2$ (central axis, perpendicular to plane)." },
          { step_number: 2, text: "Shift to the rim: distance from centre to rim is $R$." },
          { step_number: 3, text: "Parallel axis: $I = MR^2 + MR^2 = 2MR^2$." },
        ],
        status: "published",
      },
      {
        solution_type: "elimination",
        content:
          "A shifted axis always gives $I \\geq I_{\\text{cm}}$, so options A and D (which equal or undercut $I_{\\text{cm}}$) are immediately wrong. Between B and C: $3MR^2/2$ corresponds to a different axis (ring about diameter shifted), not this setup. Only C is consistent with parallel axis theorem applied to the perpendicular axis.",
        status: "published",
      },
      {
        solution_type: "trap_warning",
        content:
          "Don't confuse this with the axis through the rim *along the diameter* — that would use $I_{\\text{cm}} = MR^2/2$ plus the shift, giving $3MR^2/2$. Read the axis orientation carefully.",
        status: "published",
      },
    ],
  },

  // 5. Chemistry — Chemical Bonding
  {
    subjectSlug: "chemistry",
    chapterSlug: "physical-chemistry",
    topicSlug: "chemical-bonding",
    question_text:
      "The hybridization of the central atom in $\\mathrm{XeF_4}$ and its molecular geometry are:",
    question_type: "single_correct",
    options: [
      { id: "a", text: "$sp^3$, tetrahedral" },
      { id: "b", text: "$sp^3d$, see-saw" },
      { id: "c", text: "$sp^3d^2$, square planar" },
      { id: "d", text: "$sp^3d^3$, pentagonal bipyramidal" },
    ],
    correct_answer: { type: "single", value: "c" },
    difficulty: 2,
    estimated_time_seconds: 75,
    source: "JEE Mains (Sample)",
    year: 2022,
    solutions: [
      {
        solution_type: "standard",
        content:
          "Steric number of Xe in $\\mathrm{XeF_4}$: 4 bond pairs + 2 lone pairs = 6 electron domains → $sp^3d^2$. Two lone pairs occupy the axial positions of the octahedron; the four F atoms lie in a plane → square planar geometry.",
        steps: [
          { step_number: 1, text: "Valence electrons on Xe: 8. Bonds to 4 F consume 4, leaving 4 electrons = 2 lone pairs." },
          { step_number: 2, text: "Steric number = bonds + lone pairs = $4 + 2 = 6$. Hybridization is $sp^3d^2$." },
          { step_number: 3, text: "Lone pairs take trans-axial positions to minimize repulsion → square planar." },
        ],
        status: "published",
      },
      {
        solution_type: "pattern",
        content:
          "Noble-gas fluorides follow a clean pattern:\n$\\mathrm{XeF_2}$: steric 5 → $sp^3d$, linear.\n$\\mathrm{XeF_4}$: steric 6 → $sp^3d^2$, square planar.\n$\\mathrm{XeF_6}$: steric 7 → $sp^3d^3$, distorted octahedral.\nCount lone pairs = (valence electrons on Xe $-$ bonds)/2.",
        status: "published",
      },
      {
        solution_type: "trap_warning",
        content:
          "Don't mix up *electron geometry* (octahedral) with *molecular geometry* (square planar). The hybridization follows electron geometry; shape names describe only atom positions.",
        status: "published",
      },
    ],
  },

  // 6. Chemistry — Electrochemistry
  {
    subjectSlug: "chemistry",
    chapterSlug: "physical-chemistry",
    topicSlug: "electrochemistry",
    question_text:
      "For a concentration cell $\\mathrm{Cu\\,|\\,Cu^{2+}(0.01\\,M)\\,||\\,Cu^{2+}(1\\,M)\\,|\\,Cu}$ at 298 K, the EMF (in V) is approximately: (Use $\\dfrac{0.0591}{n}\\log\\dfrac{[\\text{cathode}]}{[\\text{anode}]}$.)",
    question_type: "numerical",
    correct_answer: { type: "numerical", value: 0.0591, tolerance: 0.002 },
    difficulty: 3,
    estimated_time_seconds: 120,
    source: "JEE Mains (Sample)",
    year: 2023,
    solutions: [
      {
        solution_type: "standard",
        content:
          "In a concentration cell $E^0 = 0$. The Nernst equation reduces to $E = \\dfrac{0.0591}{n}\\log\\dfrac{[\\mathrm{Cu^{2+}}]_{\\text{cath}}}{[\\mathrm{Cu^{2+}}]_{\\text{anode}}}$. With $n = 2$ and the ratio $1/0.01 = 100$: $E = \\dfrac{0.0591}{2}\\log 100 = \\dfrac{0.0591}{2}\\cdot 2 = 0.0591$ V.",
        steps: [
          { step_number: 1, text: "Recognize concentration cell → $E^0 = 0$." },
          { step_number: 2, text: "Apply Nernst: $E = (0.0591/n)\\log([C]/[A])$." },
          { step_number: 3, text: "Plug $n=2$ and $\\log 100 = 2$ to get $0.0591$ V." },
        ],
        status: "published",
      },
      {
        solution_type: "shortcut",
        content:
          "Whenever the concentration ratio is $10^n$ for the same $n$ as electrons transferred, the EMF equals exactly $0.0591$ V. Here $n=2$ electrons and ratio is $10^2$ — EMF = $0.0591$ V.",
        status: "published",
      },
      {
        solution_type: "trap_warning",
        content:
          "Careful with which compartment is cathode. The more concentrated $\\mathrm{Cu^{2+}}$ side is reduced (cathode); dilute side is oxidized (anode). Reversing the ratio gives a negative answer — the question asks for magnitude, which should always be positive for a working cell.",
        status: "published",
      },
    ],
  },

  // 7. Chemistry — Coordination Compounds
  {
    subjectSlug: "chemistry",
    chapterSlug: "inorganic-chemistry",
    topicSlug: "coordination-compounds",
    question_text:
      "The crystal field stabilization energy (CFSE) of $[\\mathrm{Fe(CN)_6}]^{3-}$ in units of $\\Delta_o$ is: (CN$^-$ is a strong-field ligand; Fe is in $+3$ state, $d^5$.)",
    question_type: "single_correct",
    options: [
      { id: "a", text: "$0$" },
      { id: "b", text: "$-\\dfrac{2}{5}\\Delta_o$" },
      { id: "c", text: "$-2\\Delta_o$" },
      { id: "d", text: "$-2\\Delta_o + P$" },
    ],
    correct_answer: { type: "single", value: "c" },
    difficulty: 4,
    estimated_time_seconds: 180,
    source: "JEE Advanced (Sample)",
    year: 2021,
    solutions: [
      {
        solution_type: "standard",
        content:
          "$\\mathrm{CN^-}$ is a strong-field ligand → low-spin. Fe$^{3+}$ has $d^5$. In low-spin octahedral, all 5 electrons fill $t_{2g}$. CFSE $= 5 \\times (-0.4\\Delta_o) + 0 \\times (+0.6\\Delta_o) = -2\\Delta_o$. Pairing energy $P$ is typically excluded from the 'CFSE in units of $\\Delta_o$' answer unless the question specifically includes it.",
        steps: [
          { step_number: 1, text: "Oxidation state: Fe in $[\\mathrm{Fe(CN)_6}]^{3-}$ is $+3$ → $d^5$." },
          { step_number: 2, text: "$\\mathrm{CN^-}$ strong-field → low-spin: all 5 electrons in $t_{2g}$." },
          { step_number: 3, text: "CFSE $= n_{t_{2g}}(-0.4\\Delta_o) + n_{e_g}(+0.6\\Delta_o) = -2\\Delta_o$." },
        ],
        status: "published",
      },
      {
        solution_type: "elimination",
        content:
          "Low-spin $d^5$ must have stabilization (rules out A). The value $-0.4\\Delta_o$ applies only to $d^1$, and $-2\\Delta_o + P$ mixes pairing into the CFSE accounting, which is non-standard in the 'CFSE' asked here. The clean answer is $-2\\Delta_o$.",
        status: "published",
      },
      {
        solution_type: "trap_warning",
        content:
          "Two classic traps: (1) forgetting that $\\mathrm{CN^-}$ is strong-field and computing high-spin ($d^5$ high-spin gives CFSE $= 0$); (2) including pairing energy $P$ when the question asks for CFSE only. CFSE by itself is the $t_{2g}/e_g$ stabilization; pairing penalty is reported separately.",
        status: "published",
      },
    ],
  },

  // 8. Math — Definite Integrals
  {
    subjectSlug: "mathematics",
    chapterSlug: "calculus",
    topicSlug: "definite-integrals",
    question_text:
      "Evaluate $\\displaystyle \\int_{0}^{\\pi/2} \\frac{\\sin x}{\\sin x + \\cos x}\\,dx$.",
    question_type: "single_correct",
    options: [
      { id: "a", text: "$0$" },
      { id: "b", text: "$\\dfrac{\\pi}{4}$" },
      { id: "c", text: "$\\dfrac{\\pi}{2}$" },
      { id: "d", text: "$\\dfrac{\\pi}{8}$" },
    ],
    correct_answer: { type: "single", value: "b" },
    difficulty: 3,
    estimated_time_seconds: 180,
    source: "JEE Mains (Sample)",
    year: 2019,
    solutions: [
      {
        solution_type: "standard",
        content:
          "Let $I = \\int_0^{\\pi/2} \\dfrac{\\sin x}{\\sin x + \\cos x} dx$. Using the king's property $\\int_0^a f(x)dx = \\int_0^a f(a-x)dx$: $I = \\int_0^{\\pi/2} \\dfrac{\\sin(\\pi/2 - x)}{\\sin(\\pi/2 - x) + \\cos(\\pi/2 - x)} dx = \\int_0^{\\pi/2} \\dfrac{\\cos x}{\\cos x + \\sin x} dx$. Add the two: $2I = \\int_0^{\\pi/2} 1\\,dx = \\pi/2 \\Rightarrow I = \\pi/4$.",
        steps: [
          { step_number: 1, text: "Apply king's property $x \\to \\pi/2 - x$." },
          { step_number: 2, text: "Add the two equal expressions: numerator becomes $\\sin + \\cos$, which cancels the denominator." },
          { step_number: 3, text: "So $2I = \\pi/2$, giving $I = \\pi/4$." },
        ],
        status: "published",
      },
      {
        solution_type: "pattern",
        content:
          "Any integral of the form $\\int_0^{\\pi/2} \\dfrac{f(\\sin x)}{f(\\sin x) + f(\\cos x)} dx$ evaluates to $\\pi/4$. This is the canonical 'split the symmetry' pattern.",
        when_to_use:
          "Any $\\sin/\\cos$ ratio integral over $[0, \\pi/2]$ with symmetric structure.",
        status: "published",
      },
      {
        solution_type: "elimination",
        content:
          "The integrand is strictly positive on $(0, \\pi/2)$, so $I > 0$ — rules out A. Since $\\dfrac{\\sin x}{\\sin x + \\cos x} \\leq 1$ always, $I \\leq \\pi/2$ — keeps B, C, D. The average value of the integrand over the symmetric interval is $1/2$ (by the pairing argument), so $I \\approx (1/2)(\\pi/2) = \\pi/4$.",
        status: "published",
      },
    ],
  },

  // 9. Math — Complex Numbers
  {
    subjectSlug: "mathematics",
    chapterSlug: "algebra",
    topicSlug: "complex-numbers",
    question_text:
      "Find $(1 + i)^8$ where $i = \\sqrt{-1}$.",
    question_type: "numerical",
    correct_answer: { type: "numerical", value: 16, tolerance: 0.001 },
    difficulty: 2,
    estimated_time_seconds: 90,
    source: "JEE Mains (Sample)",
    year: 2020,
    solutions: [
      {
        solution_type: "shortcut",
        content:
          "$(1+i)^2 = 1 + 2i + i^2 = 2i$. Therefore $(1+i)^8 = ((1+i)^2)^4 = (2i)^4 = 16 \\cdot i^4 = 16$.",
        steps: [
          { step_number: 1, text: "$(1+i)^2 = 2i$." },
          { step_number: 2, text: "$(2i)^4 = 2^4 \\cdot i^4 = 16 \\cdot 1 = 16$." },
        ],
        status: "published",
      },
      {
        solution_type: "standard",
        content:
          "Convert to polar: $1+i = \\sqrt{2}\\,e^{i\\pi/4}$. Then $(1+i)^8 = (\\sqrt 2)^8 \\, e^{i 2\\pi} = 16 \\cdot 1 = 16$.",
        status: "published",
      },
      {
        solution_type: "trap_warning",
        content:
          "Easy error: expanding via binomial theorem is a time sink for exponent 8. Recognize $(1+i)^2 = 2i$ and square-and-square to finish in two lines.",
        status: "published",
      },
    ],
  },

  // 10. Math — Probability
  {
    subjectSlug: "mathematics",
    chapterSlug: "probability-statistics",
    topicSlug: "probability",
    question_text:
      "A bag contains 3 red and 5 blue balls. Two balls are drawn one after the other without replacement. Given that the first ball drawn is blue, what is the probability that the second is red?",
    question_type: "single_correct",
    options: [
      { id: "a", text: "$\\dfrac{3}{8}$" },
      { id: "b", text: "$\\dfrac{3}{7}$" },
      { id: "c", text: "$\\dfrac{5}{8}$" },
      { id: "d", text: "$\\dfrac{2}{7}$" },
    ],
    correct_answer: { type: "single", value: "b" },
    difficulty: 2,
    estimated_time_seconds: 75,
    source: "JEE Mains (Sample)",
    year: 2021,
    solutions: [
      {
        solution_type: "logical",
        content:
          "After drawing a blue ball, 7 balls remain: 3 red and 4 blue. The conditional probability of drawing red next is simply $3/7$.",
        status: "published",
      },
      {
        solution_type: "standard",
        content:
          "$P(\\text{second red} \\mid \\text{first blue}) = \\dfrac{P(\\text{first blue} \\cap \\text{second red})}{P(\\text{first blue})} = \\dfrac{(5/8)(3/7)}{5/8} = 3/7$.",
        status: "published",
      },
      {
        solution_type: "trap_warning",
        content:
          "Don't use $3/8$ — that would ignore the conditioning information. 'Given that the first is blue' means 7 balls left, not 8.",
        status: "published",
      },
    ],
  },
]

// ---------- Runner ----------

function envOrThrow(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v
}

async function main() {
  const supabaseUrl = envOrThrow("NEXT_PUBLIC_SUPABASE_URL")
  const serviceKey = envOrThrow("SUPABASE_SERVICE_ROLE_KEY")
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  console.log(`Seeding ${SEED.length} questions → ${supabaseUrl}\n`)

  // Cache topic_id lookups: slug chain → id
  const topicCache = new Map<string, string>()

  async function resolveTopic(q: SeedQuestion): Promise<string | null> {
    const key = `${q.subjectSlug}/${q.chapterSlug}/${q.topicSlug}`
    if (topicCache.has(key)) return topicCache.get(key)!

    const { data: subject } = await supabase
      .from("subjects")
      .select("id")
      .eq("slug", q.subjectSlug)
      .single()
    if (!subject) return null
    const { data: chapter } = await supabase
      .from("chapters")
      .select("id")
      .eq("subject_id", subject.id)
      .eq("slug", q.chapterSlug)
      .single()
    if (!chapter) return null
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("chapter_id", chapter.id)
      .eq("slug", q.topicSlug)
      .single()
    if (!topic) return null

    topicCache.set(key, topic.id)
    return topic.id
  }

  let inserted = 0
  let skipped = 0
  let failed = 0

  for (const q of SEED) {
    const topicId = await resolveTopic(q)
    if (!topicId) {
      console.warn(
        `  SKIP  topic not found: ${q.subjectSlug}/${q.chapterSlug}/${q.topicSlug} — seed curriculum first`
      )
      failed++
      continue
    }

    // Idempotency: match on source + year + first 40 chars of question_text
    const prefix = q.question_text.slice(0, 40)
    const { data: existing } = await supabase
      .from("questions")
      .select("id")
      .eq("source", q.source)
      .eq("year", q.year)
      .ilike("question_text", `${prefix}%`)
      .maybeSingle()

    if (existing) {
      skipped++
      console.log(`  skip  ${prefix}…`)
      continue
    }

    const { data: qRow, error: qErr } = await supabase
      .from("questions")
      .insert({
        topic_id: topicId,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options ?? null,
        correct_answer: q.correct_answer,
        difficulty: q.difficulty,
        estimated_time_seconds: q.estimated_time_seconds,
        source: q.source,
        year: q.year,
        status: "published",
      })
      .select("id")
      .single()

    if (qErr || !qRow) {
      failed++
      console.error(`  FAIL  ${prefix}… → ${qErr?.message ?? "unknown error"}`)
      continue
    }

    const solutionRows = q.solutions.map((s) => ({
      question_id: qRow.id,
      solution_type: s.solution_type,
      title: s.title ?? null,
      content: s.content,
      steps: s.steps ?? null,
      time_estimate_seconds: s.time_estimate_seconds ?? null,
      when_to_use: s.when_to_use ?? null,
      when_not_to_use: s.when_not_to_use ?? null,
      difficulty_to_execute: s.difficulty_to_execute ?? null,
      status: s.status ?? "published",
    }))

    const { error: sErr } = await supabase.from("solutions").insert(solutionRows)
    if (sErr) {
      console.error(`  WARN  question ${qRow.id} inserted but solutions failed: ${sErr.message}`)
    }

    inserted++
    console.log(
      `  ok    [${q.subjectSlug}/${q.topicSlug}] ${prefix}…  (+${solutionRows.length} solutions)`
    )
  }

  console.log(
    `\nDone. Inserted ${inserted}, skipped ${skipped}, failed ${failed}.`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
