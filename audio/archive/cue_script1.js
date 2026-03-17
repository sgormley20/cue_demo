const PASSWORD = 'yourFixedPasswordHere';

const experimentData = {
  experimenter: '',
  participant: '',
  memory_data: [],
  randomisation_group: null,
  selected_trauma_index: null,
  selected_neutral_index: null,
  responses: {},
  start_time: null,
  end_time: null,
  experiment_start: null
};

const jsPsych = initJsPsych();
const timeline = [];

// Step 1: Experimenter initials
timeline.push({
  type: jsPsychSurveyText,
  questions: [{ prompt: "Enter experimenter initials:", name: 'exp_initials', required: true }],
  on_finish: data => {
    experimentData.experimenter = data.response.exp_initials.trim();
  }
});

// Step 2: Participant ID + Setup
timeline.push({
  type: jsPsychSurveyText,
  questions: [{ prompt: "Enter participant ID:", name: 'participant_id', required: true }],
  on_finish: async (data) => {
    experimentData.participant = data.response.participant_id.trim();

    try {
      // 1. Decrypt randomisation
      const encryptedFile = `encrypted_${experimentData.participant}.txt`;
      const encryptedText = await (await fetch(encryptedFile)).text();
      experimentData.randomisation_group = await decryptRandomisation(encryptedText, PASSWORD);
      if (![1, 2, 3].includes(experimentData.randomisation_group)) {
        throw new Error("Invalid randomisation group");
      }

      // 2. Load CSV
      const csvFile = `${experimentData.participant}_memories.csv`;
      const csvText = await (await fetch(csvFile)).text();
      const rows = csvText.trim().split('\n');
      const headers = rows[0].split(',').map(h => h.trim());

      const traumaIndex = headers.indexOf("Trauma Memory");
      const neutralIndex = headers.indexOf("Neutral Memory");

      if (traumaIndex === -1 || neutralIndex === -1) {
        throw new Error("Missing memory headers in CSV");
      }

      experimentData.memory_data = rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim());
        return {
          trauma: values[traumaIndex],
          neutral: values[neutralIndex]
        };
      });

      // 3. Inject blocks in correct order
      const traumaBlock = createTraumaMemoryBlock();
      const neutralBlock = createNeutralMemoryBlock();

      if (experimentData.randomisation_group === 3) {
        timeline.push(...neutralBlock, ...traumaBlock);
      } else {
        timeline.push(...traumaBlock, ...neutralBlock);
      }

    } catch (error) {
      alert("Setup failed: " + error.message);
    }
  }
});

// Now push rest of your timeline (handover, instructions, ending, etc)
timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "Instructions here. Press any key to continue."
});

// Add memory blocks later dynamically ✅

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: '<p>Press the button to end the experiment.</p>',
  choices: ['End'],
  on_finish: () => {
    // Save data here
    console.log('Done.');
  }
});

// Step 12: Decryption function
async function decryptRandomisation(encryptedBase64, password) {
  const combinedBuffer = base64ToArrayBuffer(encryptedBase64);
  const combined = new Uint8Array(combinedBuffer);
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const keyMaterial = await getKeyMaterial(password);
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  const decryptedText = decoder.decode(decryptedBuffer);

  const parsed = JSON.parse(decryptedText);
  return parseInt(parsed[0].group, 10);
}

async function getKeyMaterial(password) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
}

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Step 7: Define Trauma Block
// --- Define trauma memory block ---
function createTraumaMemoryBlock() {
  return [
    {
      type: jsPsychSurveyMultiChoice,
      questions: [{
        prompt: 'Please select one traumatic memory:',
        name: 'trauma_choice',
        options: () => experimentData.memory_data.map(m => m.trauma),
        required: true
      }],
      on_finish: data => {
        const response = data.response;
        experimentData.selected_trauma_index = experimentData.memory_data.findIndex(m => m.trauma === response.trauma_choice);
      }
    },
    {type: jsPsychHtmlButtonResponse,
       stimulus: '<p>Press the button below when you are ready to begin.</p>',
      choices: ['Start']
    },
    {
      type: jsPsychHtmlButtonResponse,
      stimulus: () => `<p>${experimentData.memory_data[experimentData.selected_trauma_index].trauma}</p>`,
      choices: ['Continue']
    },
    {
      type: jsPsychSurveyLikert,
      questions: [{
        name: 'trauma_likert_1',
        prompt: `Trauma Likert scale 1`,
        labels: ['1', '2', '3', '4', '5'],
        required: true
      }],
      on_finish: data => {
        experimentData.responses.trauma_likert_1 = data.response.trauma_likert_1;
      }
    },
    {
      type: jsPsychSurveyLikert,
      questions: [{
        name: 'trauma_likert_2',
        prompt: `Trauma Likert scale 2`,
        labels: ['1', '2', '3', '4', '5'],
        required: true
      }],
      on_finish: data => {
        experimentData.responses.trauma_likert_2 = data.response.trauma_likert_2;
      }
    },
    {
      type: jsPsychSurveyLikert,
      questions: [{
        name: 'trauma_likert_3',
        prompt: `Trauma Likert scale 3`,
        labels: ['1', '2', '3', '4', '5'],
        required: true
      }],
      on_finish: data => {
        experimentData.responses.trauma_likert_3 = data.response.trauma_likert_3;
      }
    }
  ];
}
// Step 8: Define Neutral Memory Block
function createNeutralMemoryBlock() {
  return [
    {
      type: jsPsychSurveyMultiChoice,
      questions: [{
        prompt: 'Please select one neutral memory:',
        name: 'neutral_choice',
        options: () => experimentData.memory_data.map(m => m.neutral),
        required: true
      }],
      on_finish: data => {
        const response = data.response;
        experimentData.selected_neutral_index = experimentData.memory_data.findIndex(m => m.neutral === response.neutral_choice);
      }
    },
      {type: jsPsychHtmlButtonResponse,
       stimulus: '<p>Press the button below when you are ready to begin.</p>',
      choices: ['Start']
    },
    {
      type: jsPsychHtmlButtonResponse,
      stimulus: () => `<p>${experimentData.memory_data[experimentData.selected_neutral_index].neutral}</p>`,
      choices: ['Continue']
    },
    {
      type: jsPsychSurveyLikert,
      questions: [{
        name: 'neutral_likert_1',
        prompt: `Neutral Likert scale 1`,
        labels: ['1', '2', '3', '4', '5'],
        required: true
      }],
      on_finish: data => {
        experimentData.responses.neutral_likert_1 = data.response.neutral_likert_1;
      }
    },
    {
      type: jsPsychSurveyLikert,
      questions: [{
        name: 'neutral_likert_2',
        prompt: `Neutral Likert scale 2`,
        labels: ['1', '2', '3', '4', '5'],
        required: true
      }],
      on_finish: data => {
        experimentData.responses.neutral_likert_2 = data.response.neutral_likert_2;
      }
    },
    {
      type: jsPsychSurveyLikert,
      questions: [{
        name: 'neutral_likert_3',
        prompt: `Neutral Likert scale 3`,
        labels: ['1', '2', '3', '4', '5'],
        required: true
      }],
      on_finish: data => {
        experimentData.responses.neutral_likert_3 = data.response.neutral_likert_3;
      }
    }
  ];
}
jsPsych.run(timeline);
