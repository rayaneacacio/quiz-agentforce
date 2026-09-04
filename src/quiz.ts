type Option = {
  id: string;
  text: string;
};

type Question = {
  question: string;
  options: Option[];
  correctAnswer: string;
};

type Scenario = {
  scenario: string;
  questions: Question[];
};

type QuizItem = Question | Scenario;

type Trail = "champion" | "innovator" | "legend" | "all";

let questions: QuizItem[] = [];
let currentQuestion = 0;

const questionElement = document.querySelector(
  "#question"
) as HTMLDivElement;

const previousButton = document.querySelector(
  "#previous-button"
) as HTMLButtonElement;

const nextButton = document.querySelector(
  "#next-button"
) as HTMLButtonElement;

const quizElement = document.querySelector(
  "#quiz"
) as HTMLDivElement;

const isScenario = (item: QuizItem): item is Scenario => {
  return "scenario" in item;
};

const quizFiles = {
  champion: "/questions/champion.json",
  innovator: "/questions/innovator.json",
  legend: "/questions/legend.json",
};

let selectedTrail: Trail = "champion";

const loadQuiz = async (trail: Trail): Promise<void> => {
  let quizFilesToLoad: string[];

  if (trail === "all") {
    quizFilesToLoad = [
      quizFiles.champion,
      quizFiles.innovator,
      quizFiles.legend,
    ];
  } else {
    quizFilesToLoad = [quizFiles[trail]];
  }

  const responses = await Promise.all(quizFilesToLoad.map((file) => fetch(file)));

  responses.forEach((response) => {
    if (!response.ok) throw new Error("Não foi possível carregar um dos arquivos do quiz.");
  });

  const data = await Promise.all(responses.map((response) => response.json()));

  questions = data.flat();

  currentQuestion = 0;

  quizElement.hidden = false;

  updateActiveButton();
  renderQuestion();
};

const updateActiveButton = (): void => {
  const buttons = document.querySelectorAll<HTMLButtonElement>(".trail-button");

  buttons.forEach((button) => {
    button.classList.remove("active");

    if (button.dataset.trail === selectedTrail) button.classList.add("active");
  });
};

const trailButtons = document.querySelectorAll<HTMLButtonElement>(".trail-button");

trailButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const trail = button.dataset.trail as Trail;

    selectedTrail = trail;

    await loadQuiz(trail);
  });
});

const renderQuestion = (): void => {
  const item = questions[currentQuestion];

  questionElement.innerHTML = "";

  if (isScenario(item)) renderScenario(item);
  else renderSingleQuestion(item);

  updateNavigationButtons();
};

const renderSingleQuestion = (question: Question): void => {
  const questionContainer = createQuestionElement(question);

  questionElement.appendChild(questionContainer);
};

const renderScenario = (scenario: Scenario): void => {
  const scenarioElement = document.createElement("div");

  scenarioElement.classList.add("scenario");

  const scenarioTitle = document.createElement("h2");
  scenarioTitle.textContent = "Scenario";

  const scenarioText = document.createElement("p");
  scenarioText.textContent = scenario.scenario;

  scenarioElement.appendChild(scenarioTitle);
  scenarioElement.appendChild(scenarioText);

  questionElement.appendChild(scenarioElement);

  scenario.questions.forEach((question) => {
    const questionContainer = createQuestionElement(question);

    questionElement.appendChild(questionContainer);
  });
};

const createQuestionElement = (
  question: Question
): HTMLDivElement => {
  const container = document.createElement("div");

  container.classList.add("question-container");

  const title = document.createElement("h3");
  title.textContent = question.question;

  const optionsContainer = document.createElement("div");

  optionsContainer.classList.add("question-options");

  container.appendChild(title);
  container.appendChild(optionsContainer);

  question.options.forEach((option) => {
    const button = document.createElement("button");

    button.classList.add("option");

    button.textContent = option.text;

    button.addEventListener("click", () => {
      selectAnswer(
        option.id,
        button,
        question.correctAnswer,
        optionsContainer
      );
    });

    optionsContainer.appendChild(button);
  });

  return container;
};

const selectAnswer = (
  answerId: string,
  button: HTMLButtonElement,
  correctAnswer: string,
  optionsContainer: HTMLDivElement
): void => {
  const buttons = optionsContainer.querySelectorAll<HTMLButtonElement>("button");

  buttons.forEach((option) => {
    option.disabled = true;
  });

  if (answerId === correctAnswer) button.classList.add("button_success");
  else {
    button.classList.add("button_error");

    const correctButton = optionsContainer.querySelector<HTMLButtonElement>(`[data-option-id="${correctAnswer}"]`);

    correctButton?.classList.add("button_success");
  }
};

const updateNavigationButtons = (): void => {
  previousButton.disabled = currentQuestion === 0;

  nextButton.disabled = currentQuestion === questions.length - 1;
};

const previousQuestion = (): void => {
  if (currentQuestion === 0) return;

  currentQuestion--;

  renderQuestion();
};

const nextQuestion = (): void => {
  if (currentQuestion >= questions.length - 1) return;

  currentQuestion++;

  renderQuestion();
};

const restartQuiz = (): void => {
  currentQuestion = 0;

  quizElement.hidden = false;

  renderQuestion();
};

previousButton.addEventListener(
  "click",
  previousQuestion
);

nextButton.addEventListener(
  "click",
  nextQuestion
);

loadQuiz("champion");
