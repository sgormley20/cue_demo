const encoded = [239,176,173,194,187,168,248,217,243,177,197,201,255,209,190,170,251,221,186,228,199,191,254,200];
const key = 137;

const PASSWORD = String.fromCharCode(
  ...encoded.map(n => n ^ key)
);

const APPROVED_EXPERIMENTER_IDS = [
  "AB"
];

function createResponseProxy(obj) {
  return new Proxy(obj, {
    set(target, property, value) {
      target[property] = value;
      return true;
    }
  });
}

function createExperimentData() {
  return {
    experimenter: '',
    job_role: '',
    participant: '',
    session_number: null,
    memory_data: [],
    randomisation_group: null,
    selected_trauma_index: null,
    trauma_prompt: null,
    trauma_memory_reminder: null,
    selected_neutral_index: null,
    neutral_prompt: null,
    neutral_memory_reminder: null,
    responses: createResponseProxy({}),
    start_time: null,
    end_time: null,
    experiment_start: null,
    first_block_start: null,
    second_block_start: null
  };
}

const baseExperimentData = createExperimentData();

let experimentData = new Proxy(baseExperimentData, {
  set(target, property, value) {
    target[property] = value;
    return true;
  }
});

const likert_vivid_labels = [
  "Not at all Vivid", "A little Vivid", "Somewhat Vivid", "Moderately Vivid", "Considerably Vivid", "Very Vivid", "Extremley Vivid"
];

const likert_pos_neg_labels = [
  "Extremely Negative", "Very Negative", "Moderately Negative", "Neutral (neither positive or negative)", "Moderately Positive", "Very Positive", "Extremely Positive"
];

const likert_intensity_labels = [
  "Not at all Emotionally Intense", "Slightly Emotionally Intense", "Somewhat Emotionally Intense", "Moderately Emotionally Intense", "Considerably Emotionally Intense", "Very Emotionally Intense", "Extremley Emotionally Intense"
];

function recordBlockStart() {
  const now = new Date().toLocaleString();

  if (!experimentData.first_block_start) {
    experimentData.first_block_start = now;
  } else if (!experimentData.second_block_start) {
    experimentData.second_block_start = now;
  }
}

function autoplayAudio() {
  const audio = document.querySelector(".instruction-audio");
  if (!audio) return;

  audio.currentTime = 0;

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(err => {
      console.warn("Autoplay blocked:", err);
    });
  }

  document.body.focus();
}

function audioHtml(src) {
  return `
    <audio class="instruction-audio" src="${src}" preload="auto"></audio>
  `;
}

function instructionScreen(text, audioFile = null, continueText = "Press any key to continue.") {
  let stimulus = `
    <div style="max-width: 800px; margin: auto; text-align: center; line-height: 1.6;">
      <div style="font-size: 22px;">
        ${text}
      </div>

      ${continueText ? `
        <div style="margin-top: 40px; font-size: 18px;">
          <p><strong>${continueText}</strong></p>
        </div>
      ` : ""}
    </div>
  `;

  if (audioFile) {
    stimulus += audioHtml(audioFile);
  }

  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: stimulus,
    on_load: function() {
      if (audioFile) autoplayAudio();
    }
  };
}

const jsPsych = initJsPsych({
  display_element: 'jspsych-target'
});

const timeline = [];

async function startExperiment() {
  // Researcher Name
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div style="max-width: 600px; margin: auto; text-align: center; font-size: 18px;">
        <p><strong> Demo version</strong></p>
        <p>Please enter the <strong>Researcher's Name</strong>:</p>
        <input id="exp-initials-input" type="text" style="font-size: 18px; text-align: center;" autofocus />
        <p style="color:red;" id="error-message"></p>
        <button id="continue-button" style="margin-top: 20px; font-size: 18px;">Continue</button>
      </div>
    `,
    choices: "NO_KEYS",
    on_load: () => {
      const input = document.getElementById("exp-initials-input");
      const button = document.getElementById("continue-button");
      const error = document.getElementById("error-message");

      input.addEventListener("input", () => {
        input.value = input.value.replace(/[^a-zA-Z-\s]/g, '');
      });

      const submit = () => {
        const value = input.value.trim();
        if (value.length === 0) {
          error.textContent = "Please enter name.";
        } else {
          jsPsych.finishTrial({ exp_initials: value });
        }
      };

      button.addEventListener("click", submit);

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          submit();
        }
      });

      input.focus();
    },
    on_finish: data => {
      experimentData.experimenter = data.exp_initials;
    }
  });

  // Researcher Job Role
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div style="max-width: 600px; margin: auto; text-align: center; font-size: 18px;">
        <p>Please enter the <strong>Researcher's Job Role</strong>:</p>
        <input id="exp-role-input" type="text" style="font-size: 18px; text-align: center;" autofocus />
        <p style="color:red;" id="error-message"></p>
        <button id="continue-button" style="margin-top: 20px; font-size: 18px;">Continue</button>
      </div>
    `,
    choices: "NO_KEYS",
    on_load: () => {
      const input = document.getElementById("exp-role-input");
      const button = document.getElementById("continue-button");
      const error = document.getElementById("error-message");

      input.addEventListener("input", () => {
        input.value = input.value.replace(/[^a-zA-Z-\s]/g, '');
      });

      const submit = () => {
        const value = input.value.trim();
        if (value.length === 0) {
          error.textContent = "Please enter role.";
        } else {
          jsPsych.finishTrial({ exp_role: value });
        }
      };

      button.addEventListener("click", submit);

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          submit();
        }
      });

      input.focus();
    },
    on_finish: data => {
      experimentData.job_role = data.exp_role;
    }
  });

  // Researcher ID
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div style="max-width: 600px; margin: auto; text-align: center; font-size: 18px;">
        <p>Please enter your <strong>Researcher ID</strong>:</p>
        <input id="exp-id-input" type="text" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" style="font-size: 18px; text-align: center;" autofocus />
        <p style="color:red;" id="error-message"></p>
        <button id="continue-button" style="margin-top: 20px; font-size: 18px;">Continue</button>
      </div>
    `,
    choices: "NO_KEYS",
    on_load: () => {
      const input = document.getElementById("exp-id-input");
      const button = document.getElementById("continue-button");
      const error = document.getElementById("error-message");

      input.addEventListener("input", () => {
        input.value = input.value.replace(/[^-a-zA-Z0-9]/g, '').toUpperCase();
      });

      const submit = () => {
        const value = input.value.trim().toUpperCase();

        error.textContent = "";

        if (!value) {
          error.textContent = "Please enter ID.";
          return;
        }

        if (!APPROVED_EXPERIMENTER_IDS.includes(value)) {
          error.textContent = "Invalid ID. Please check and try again.";
          return;
        }

        jsPsych.finishTrial({ experimenter_ID: value });
      };

      button.addEventListener("click", submit);

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submit();
      });

      input.focus();
    },
    on_finish: data => {
      experimentData.experimenter_ID = data.experimenter_ID;
    }
  });

  // Participant ID
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div style="max-width: 600px; margin: auto; text-align: center; font-size: 18px;">
        <p>Please enter <strong>Participant ID:</strong></p>
        <span style="font-size:14px; color:#555;"> Enter in study format (e.g., S1-001) </span>
        <input id="participant-id-input" type="text" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" style="font-size: 18px; text-align: center;" autofocus />
        <p style="color:red;" id="error-message"></p>
        <button id="continue-button" style="margin-top: 20px; font-size: 18px;">Continue</button>
      </div>
    `,
    choices: "NO_KEYS",
    on_load: () => {
      const input = document.getElementById("participant-id-input");
      const button = document.getElementById("continue-button");
      const error = document.getElementById("error-message");

      input.addEventListener("input", () => {
        input.value = input.value.replace(/[^-a-zA-Z0-9]/g, '').toUpperCase();
      });

      const submit = () => {
        const value = input.value.trim().toUpperCase();

        if (!value) {
          error.textContent = "Please enter Participant ID.";
          return;
        }

        if (!/^S\d-\d{3}$/.test(value)) {
          error.textContent = "Participant ID must be in the format S1-001.";
          return;
        }

        jsPsych.finishTrial({ participant_id: value });
      };

      button.addEventListener("click", submit);

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submit();
      });

      input.focus();
    },
    on_finish: data => {
      const participant = data.participant_id.trim().toUpperCase();
      experimentData.participant = participant;
      jsPsych.data.addProperties({ participant_id: participant });
    }
  });

  // Session number
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <style>
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type=number] {
          -moz-appearance: textfield;
        }
      </style>

      <div style="max-width: 600px; margin: auto; text-align: center; font-size: 18px;">
        <p>Please enter the <strong>session number</strong> (1–5):</p>
        <input id="session-input" type="number" min="1" max="5" maxlength="1" inputmode="numeric" 
               style="font-size: 18px; width: 80px; text-align: center;" autofocus />
        <p style="color:red;" id="error-message"></p>
        <button id="continue-button" style="margin-top: 20px; font-size: 18px;">Continue</button>
      </div>
    `,
    choices: "NO_KEYS",
    on_load: () => {
      const input = document.getElementById("session-input");
      const error = document.getElementById("error-message");
      const button = document.getElementById("continue-button");

      input.addEventListener("wheel", e => e.preventDefault());

      input.addEventListener("input", () => {
        if (input.value.length > 1) {
          input.value = input.value.slice(0, 1);
        }
      });

      const submit = () => {
        const value = input.value.trim();
        const num = parseInt(value);

        if (!value || isNaN(num) || num < 1 || num > 5) {
          error.textContent = "Please enter a number between 1 and 5.";
        } else {
          jsPsych.finishTrial({ session_number: num });
        }
      };

      button.addEventListener("click", submit);

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          submit();
        }
      });

      input.focus();
    },
    on_finish: data => {
      experimentData.session_number = data.session_number;
    }
  });

  await jsPsych.run(timeline.slice(0, 5));

  try {
  let encryptedText;

  try {
    const randomisationFilename = `encrypted_R-NOT-${experimentData.participant}.txt`;
    console.log("Loading randomisation file:", randomisationFilename);
    const response = await fetch(randomisationFilename);

    if (!response.ok) {
      throw new Error("Randomisation file not found");
    }

    encryptedText = await response.text();
  } catch (err) {
    alert("Error: Could not load randomisation file for this participant.");
    throw err;
  }

  experimentData.randomisation_group = await decryptRandomisation(encryptedText, PASSWORD);

  if (![1, 2, 3].includes(experimentData.randomisation_group)) {
    throw new Error("Invalid randomisation group");
  }

  let csvText;

  try {
    const csvFilename = `R-NOT-${experimentData.participant}_memories.csv`;
    const response = await fetch(csvFilename);

    if (!response.ok) {
      throw new Error("CSV file not found");
    }

    csvText = await response.text();
  } catch (err) {
    alert("Error: Could not load memory file for this participant.");
    throw err;
  }

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

  timeline.push({
    type: jsPsychSurveyMultiChoice,
    questions: [{
      prompt: `<p>Following discussion with the participant, please select the traumatic memory they wish to work with today:</p>`,
      name: "trauma_choice",
      options: experimentData.memory_data.map(m => m.trauma),
      required: true
    }],
    on_finish: data => {
      const selected = data.response["trauma_choice"];
      experimentData.selected_trauma_index =
        experimentData.memory_data.findIndex(m => m.trauma === selected);
    }
  });

  timeline.push({
    type: jsPsychCallFunction,
    func: setNeutralMemoryFromTrauma
  });

    timeline.push({
    ...instructionScreen(
      '<p>Press any key and hand the laptop to the participant.</p>',
      null,
      null
    ),
    on_finish: () => {
      experimentData.experiment_start = new Date().toLocaleString();
    }
  });

  timeline.push({
    timeline: [
      instructionScreen(
        `
        <p>In the next section, we will ask you to bring a memory to mind. </p>
        <p>This will either be an intrusive memory of the traumatic event OR a neutral memory.</p> 
        <p>It will be one of the memories you discussed with the researcher at your first visit.</p>
        `,
        "audio/page_1.wav"
      ),

      instructionScreen(
        `
        <p>At your first visit, we asked you to give each of your neutral and intrusive memories a title or label, consisting of a word or phrase that would be a <strong>good reminder</strong> for each of the neutral and intrusive memories you told us about.</p>
        `,
        "audio/page_2.wav"
      ),

      instructionScreen(
        `
        <p>In the next section, you will see <u><strong>one</strong></u> of these reminders for <strong>either</strong> a neutral or intrusive memory.</p>
        <p>When you see the reminder, you are asked to <u><strong><em>briefly</em></strong></u> bring the associated memory to mind.</p>
        `,
        "audio/page_3.wav"
      ),
    ],
    conditional_function: () => experimentData.session_number === 1
  });

  timeline.push({
    type: jsPsychCallFunction,
    func: () => {
      if (experimentData.selected_trauma_index == null) {
        throw new Error("Trauma memory not selected");
      }

      if (experimentData.selected_neutral_index == null) {
        throw new Error("Neutral memory not set");
      }
    }
  });

    const betweenBlocksScreens = [
    instructionScreen(
      `<p>Please hand the computer back to the Researcher.</p>`,
      null,
      null
    ),
    instructionScreen(
      `<p>Please press any key and hand the computer back to the participant.</p>`,
      null,
      null
    )
  ];

  const traumaBlock = createMemoryBlock("trauma");
  const neutralBlock = createMemoryBlock("neutral");

  if (experimentData.randomisation_group === 3) {
    timeline.push(
      ...neutralBlock,
      ...betweenBlocksScreens,
      ...traumaBlock
    );
  } else {
    timeline.push(
      ...traumaBlock,
      ...betweenBlocksScreens,
      ...neutralBlock
    );
  }

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <p>Please press the button to end the experiment.</p>
    `,
    choices: ['End'],
    on_finish: () => {
      alert("Experiment finished.");
      console.log("Done.");
    }
  });

  await jsPsych.run(timeline.slice(5));

} catch (err) {
  alert("Setup failed: " + err.message);
}
}

function setNeutralMemoryFromTrauma() {
  const index = experimentData.selected_trauma_index;

  if (index == null || !experimentData.memory_data[index]) {
    throw new Error("Trauma memory not selected");
  }

  experimentData.selected_neutral_index = index;
}

function buildLikertTrial({ type, nameSuffix, prompt, labels, labelArray }) {
  const key = `${type}_${nameSuffix}`;

  return {
    type: jsPsychSurveyLikert,
    questions: [{
      name: key,
      prompt: `
        ${prompt}
      `,
      labels: labels,
      required: true
    }],
    on_finish: data => {
      experimentData.responses[key] = data.response[key];
      experimentData.responses[`${key}_label`] = labelArray[data.response[key]];
    }
  };
}

function createMemoryBlock(type) {
  const isTrauma = type === "trauma";

  const selectedIndexKey = `selected_${type}_index`;
  const promptKey = `${type}_prompt`;
  const reminderKey = `${type}_memory_reminder`;

  const intro1Text = isTrauma
    ? `
      <p>You will next see a reminder of one of the <strong>traumatic intrusive memories</strong> you told us about at your first visit.</p>
      <p>When you see the reminder word or phrase, <em>briefly</em> bring the associated intrusive memory to mind <u><strong><em>until you see it clearly in your mind's eye.</em></strong></u></p>
      <p>Some people find it helpful to close their eyes to help them remember clearly.</p>
    `
    : `
      <p>You will next see a reminder of one of the <strong>neutral memories</strong> you told us about at your first visit.</p>
      <p>When you see the reminder word or phrase, <em>briefly</em> bring the associated memory to mind <u><strong><em>until you see it clearly in your mind’s eye.</em></strong></u></p>
      <p>Some people find it helpful to close their eyes to help them remember clearly.</p>
    `;

  const intro2Text = isTrauma
    ? `<p>Please remember, we only want to 'jog your memory'. We do not want you to become fully absorbed in the memory or to become very upset.</p>`
    : `<p>Please remember, we are asking you to <strong>recall</strong> one of your neutral memories, not an upsetting one.</p>`;

  const intro3Text = isTrauma
    ? `
      <p>When the reminder word or phrase appears, please bring the associated intrusive memory to mind until you see it clearly in your mind’s eye.</p>
      <p>Hold the memory in your mind for a few seconds until you connect with it emotionally, before allowing it to fade away.</p>
      <p>You will then be asked to provide some ratings for the memory.</p>
    `
    : `
      <p>When the reminder word appears, please bring the associated memory to mind until you see it clearly in your mind's eye.</p>
      <p>Hold the memory in your mind for a few seconds, before allowing it to fade away.</p>
      <p>You will then be asked to provide some ratings for the memory.</p>
    `;

    const audioPrefix = isTrauma ? "traumatic" : "neutral";

  return [
    {
      type: jsPsychCallFunction,
      func: recordBlockStart
    },

    instructionScreen(intro1Text, `audio/${audioPrefix}_1.wav`, "If you are ready, please press any key to continue."),
    instructionScreen(intro2Text, `audio/${audioPrefix}_2.wav`, "If you are ready, please press any key to continue."),
    instructionScreen(intro3Text, `audio/${audioPrefix}_3.wav`, "If you are ready, please press any key to continue."),

    //START
   {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
    <p>If you are ready, please press the start button to see the reminder word or phrase.</p>
    ${audioHtml("audio/start.wav")}
        `,
    choices: ["Start"],
    on_load: () => {
    autoplayAudio();
        }
    },
//Reminder
    {
    type: jsPsychHtmlButtonResponse,
    stimulus: () => {
    const idx = experimentData[selectedIndexKey];

    const reminderText = isTrauma
      ? `Bring the associated intrusive memory to mind until you see it clearly. Once you can clearly see the memory in your mind’s eye please press the continue button.`
      : `Bring the associated neutral memory to mind until you see it clearly. Once you can clearly see the memory in your mind’s eye please press the continue button.`;

        return `
        <div style="max-width: 600px; margin: auto; text-align: center; font-size: 18px;">
        <p>${experimentData.memory_data[idx][type]}</p>
        <p style="margin-top: 30px; font-style: italic; color: #555;">
          ${reminderText}
        </p>
        </div>
        ${audioHtml(`audio/${audioPrefix}_4.wav`)}
        `;
    },
    choices: ["Continue"],
    on_load: () => {
    autoplayAudio();
        }
    },



    instructionScreen(
      `<p>Next, please complete the following questions about the memory</p>`,
      null,
      "If you are ready, please press any key to continue."
    ),

    {
      type: jsPsychSurveyText,
      questions: [{
        prompt: `<p>What was the reminder word/phrase you saw?</p>`,
        name: promptKey,
        required: true
      }],
      on_finish: data => {
        experimentData[promptKey] = data.response[promptKey].trim();
      }
    },

    {
      type: jsPsychSurveyMultiChoice,
      questions: [{
        prompt: `<p>Did the word remind you of a traumatic memory or a neutral memory?</p>`,
        name: reminderKey,
        options: ["Traumatic Memory", "Neutral Memory"],
        required: true
      }],
      on_finish: data => {
        experimentData[reminderKey] = data.response[reminderKey];
      }
    },

    instructionScreen(`
      <p>Please rate the memory on the following scales:</p>
      <p>1) Vividness – how clear, detailed or crisp was the memory?</p>
      <p>2) Positiveness-negativeness – was the memory associated with positive (good) or negative (bad) emotions, or neutral?</p>
      <p>3) Emotional intensity – how intense were your emotions when you recalled the memory?</p>
    `),

    buildLikertTrial({
      type,
      nameSuffix: "likert_vivid",
      prompt: `<p>How vivid was the memory?</p>`,
      labels: likert_vivid_labels,
      labelArray: likert_vivid_labels
    }),

    buildLikertTrial({
      type,
      nameSuffix: "likert_pos_neg",
      prompt: `<p>How Positive/Negative was the memory?</p>`,
      labels: likert_pos_neg_labels,
      labelArray: likert_pos_neg_labels
    }),

    buildLikertTrial({
      type,
      nameSuffix: "likert_intensity",
      prompt: `<p>How emotionally intense was the memory?</p>`,
      labels: likert_intensity_labels,
      labelArray: likert_intensity_labels
    })
  ];
}

async function decryptRandomisation(encryptedBase64, password) {
  const combinedBuffer = base64ToArrayBuffer(encryptedBase64);
  const combined = new Uint8Array(combinedBuffer);
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const keyMaterial = await getKeyMaterial(password);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
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
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

startExperiment();