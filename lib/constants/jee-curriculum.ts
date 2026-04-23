// Canonical JEE curriculum used by the "Seed JEE Curriculum" admin action and
// by the seed-questions script when resolving topic_id by slug. Keep the
// ordering here stable — display_order is derived from array position.

export type CurriculumTopic = { name: string }
export type CurriculumChapter = { name: string; topics: CurriculumTopic[] }
export type CurriculumSubject = {
  name: string
  exam: string
  chapters: CurriculumChapter[]
}

export const JEE_CURRICULUM: CurriculumSubject[] = [
  {
    name: "Physics",
    exam: "jee_mains",
    chapters: [
      {
        name: "Mechanics",
        topics: [
          { name: "Kinematics" },
          { name: "Laws of Motion" },
          { name: "Work Energy Power" },
          { name: "Rotational Motion" },
          { name: "Gravitation" },
        ],
      },
      {
        name: "Thermodynamics",
        topics: [
          { name: "Thermal Properties" },
          { name: "Kinetic Theory" },
          { name: "Thermodynamics Laws" },
        ],
      },
      {
        name: "Waves & Oscillations",
        topics: [{ name: "SHM" }, { name: "Waves" }, { name: "Sound" }],
      },
      {
        name: "Electromagnetism",
        topics: [
          { name: "Electrostatics" },
          { name: "Current Electricity" },
          { name: "Magnetic Effects" },
          { name: "EMI" },
          { name: "AC" },
        ],
      },
      {
        name: "Optics",
        topics: [{ name: "Ray Optics" }, { name: "Wave Optics" }],
      },
      {
        name: "Modern Physics",
        topics: [
          { name: "Dual Nature" },
          { name: "Atoms" },
          { name: "Nuclei" },
          { name: "Semiconductors" },
        ],
      },
    ],
  },

  {
    name: "Chemistry",
    exam: "jee_mains",
    chapters: [
      {
        name: "Physical Chemistry",
        topics: [
          { name: "Mole Concept" },
          { name: "Atomic Structure" },
          { name: "Chemical Bonding" },
          { name: "States of Matter" },
          { name: "Thermodynamics" },
          { name: "Equilibrium" },
          { name: "Redox" },
          { name: "Electrochemistry" },
          { name: "Chemical Kinetics" },
          { name: "Solutions" },
        ],
      },
      {
        name: "Inorganic Chemistry",
        topics: [
          { name: "Periodic Table" },
          { name: "s-Block" },
          { name: "p-Block" },
          { name: "d and f Block" },
          { name: "Coordination Compounds" },
          { name: "Qualitative Analysis" },
        ],
      },
      {
        name: "Organic Chemistry",
        topics: [
          { name: "GOC" },
          { name: "Hydrocarbons" },
          { name: "Haloalkanes" },
          { name: "Alcohols Phenols Ethers" },
          { name: "Aldehydes Ketones Carboxylic Acids" },
          { name: "Amines" },
          { name: "Biomolecules" },
          { name: "Polymers" },
        ],
      },
    ],
  },

  {
    name: "Mathematics",
    exam: "jee_mains",
    chapters: [
      {
        name: "Algebra",
        topics: [
          { name: "Sets Relations Functions" },
          { name: "Complex Numbers" },
          { name: "Quadratic Equations" },
          { name: "Sequences Series" },
          { name: "Permutations Combinations" },
          { name: "Binomial Theorem" },
          { name: "Matrices Determinants" },
        ],
      },
      {
        name: "Calculus",
        topics: [
          { name: "Limits Continuity Differentiability" },
          { name: "Differentiation" },
          { name: "Application of Derivatives" },
          { name: "Integration" },
          { name: "Definite Integrals" },
          { name: "Differential Equations" },
          { name: "Area under Curves" },
        ],
      },
      {
        name: "Coordinate Geometry",
        topics: [
          { name: "Straight Lines" },
          { name: "Circles" },
          { name: "Parabola" },
          { name: "Ellipse" },
          { name: "Hyperbola" },
        ],
      },
      {
        name: "Trigonometry",
        topics: [
          { name: "Trigonometric Functions" },
          { name: "Inverse Trig" },
          { name: "Solution of Triangles" },
          { name: "Heights and Distances" },
        ],
      },
      {
        name: "Vectors 3D Geometry",
        topics: [{ name: "Vectors" }, { name: "3D Geometry" }],
      },
      {
        name: "Probability Statistics",
        topics: [
          { name: "Probability" },
          { name: "Statistics" },
          { name: "Mathematical Reasoning" },
        ],
      },
    ],
  },
]
