import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { GET_LANGUAGES, GET_CODE_BLOCKS } from '../utils/queries';

function Home() {
    const [languageId, setLanguageId] = useState(null);
    const [codeBlocks, setCodeBlocks] = useState([]);
    const [currentCodeBlockIndex, setCurrentCodeBlockIndex] = useState(null);
    const [userInput, setUserInput] = useState('');
    const [startTime, setStartTime] = useState(null);
    const [typingSpeed, setTypingSpeed] = useState(null);
    const [timer, setTimer] = useState(90);
    const [timerStarted, setTimerStarted] = useState(false);
    const [score, setScore] = useState(null);
    const inputRef = useRef(null);

    // Fetch languages when the component mounts
    const { loading: languagesLoading, data: languagesData } = useQuery(GET_LANGUAGES);

    // Fetch code blocks when the language changes
    const { loading: codeBlocksLoading, data: codeBlocksData } = useQuery(GET_CODE_BLOCKS, {
        variables: { languageId },
        skip: !languageId,
    });

    useEffect(() => {
        // Set default language when languages are loaded
        if (!languagesLoading && languagesData && languagesData.getLanguages.length > 0) {
            setLanguageId(languagesData.getLanguages[0]._id);
        }
    }, [languagesLoading, languagesData]);

    useEffect(() => {
        // Set code blocks when languageId changes
        if (!codeBlocksLoading && codeBlocksData) {
            setCodeBlocks(codeBlocksData.getCodeBlocks);
            setCurrentCodeBlockIndex(generateRandomIndex(codeBlocksData.getCodeBlocks.length));
        }
    }, [codeBlocksLoading, codeBlocksData, languageId]);

    useEffect(() => {
        // Check if the timer has reached 0
        if (timer === 0) {
            // Stop the timer
            setTimerStarted(false);
            // Calculate and display the score
            calculateScore();
        }
    }, [timer]);

    const generateRandomIndex = (maxIndex) => {
        return Math.floor(Math.random() * maxIndex);
    };

    const calculateScore = () => {
        const endTime = Date.now();
        const timeInSeconds = (endTime - startTime) / 1000;

        // Calculate the number of correct characters typed
        const correctCharacters = userInput.split('').reduce((count, char, index) => {
            return count + (char === codeBlocks[currentCodeBlockIndex].value[index] ? 1 : 0);
        }, 0);

        // Calculate CPM based on correct characters
        const cpm = Math.round((correctCharacters / timeInSeconds) * 60);

        setTypingSpeed(cpm);
        setScore(correctCharacters);
    };


    const handleInputChange = (e) => {
        const inputText = e.target.value;

        setUserInput(inputText);

        // Start the timer when the user starts typing
        if (!startTime) {
            setTimerStarted(true);
            setStartTime(Date.now());
        }

        // Check if the input matches the code block
        const codeBlockText = codeBlocks[currentCodeBlockIndex]?.value;
        if (inputText === codeBlockText && !typingSpeed) {
            // User has completed typing the code block
            setTimerStarted(false);
            calculateScore();
        }
    };

    const handleButtonClick = () => {
        if (codeBlocks.length > 1) {
            let newIndex;

            do {
                // Generate a new random index for the code block array
                newIndex = generateRandomIndex(codeBlocks.length);
            } while (newIndex === currentCodeBlockIndex);
            setCurrentCodeBlockIndex(newIndex);
        }
        // Reset typing speed, user input, and timer
        setTypingSpeed(null);
        setUserInput('');
        setTimer(90);
        setTimerStarted(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault(); // Prevent the default tab behavior
            const { selectionStart, selectionEnd } = e.target;
            const spaces = '    '; // Four spaces
            const newInput =
                userInput.substring(0, selectionStart) +
                spaces +
                userInput.substring(selectionEnd);

            setUserInput(newInput);
        }
    };


    const generateSpanArray = (text, userInput) => {
        const spanArray = [];
        const minLength = Math.min(text.length, userInput.length);

        for (let i = 0; i < minLength; i++) {
            const isCorrect = text[i] === userInput[i];
            const backgroundColor = isCorrect ? 'bg-green-700' : 'bg-red-700';

            spanArray.push(
                <span key={i} className={`text-white ${backgroundColor}`}>
                    {text[i]}
                </span>
            );
        }

        if (text.length > minLength) {
            for (let i = minLength; i < text.length; i++) {
                spanArray.push(
                    <span key={i} className="text-white">
                        {text[i]}
                    </span>
                );
            }
        }

        return spanArray;
    };

    useEffect(() => {
        // Update the timer every second if timer has started
        if (timerStarted && timer > 0) {
            const interval = setInterval(() => {
                setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
            }, 1000);

            // Cleanup the interval on component unmount
            return () => clearInterval(interval);
        }
    }, [timerStarted, timer]);

    return (
        <section className="home flex flex-col items-center justify-center mt-36 mx-auto">
            <div className="flex items-center">
                {/* Display buttons for each language */}
                <div className="languages flex mr-3">
                    {languagesData &&
                        languagesData.getLanguages.map((language) => (
                            <p
                                key={language._id}
                                onClick={() => setLanguageId(language._id)}
                                className="cursor-pointer"
                            >
                                {language.name} |
                            </p>
                        ))}
                </div>
                {/* Display button to fetch a new random code block */}
                <button onClick={handleButtonClick} className="my-btn my-3">
                    New Race
                </button>
            </div>
            {/* Display the current code block with dynamic styling */}
            <div className="code-block p-4 rounded-md my-3">
                {codeBlocks[currentCodeBlockIndex] && (
                    <pre className="my-2 text-white">
                        <code>
                            {generateSpanArray(
                                codeBlocks[currentCodeBlockIndex].value,
                                userInput
                            )}
                        </code>
                    </pre>
                )}
            </div>

            <textarea
                rows="4" // Set the number of rows you want to display
                ref={inputRef}
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onPaste={(e) => e.preventDefault()}
                className="p-2 rounded-md focus:outline-none mt-4 resize-none"
                placeholder="Timer starts when you type..."
            />
            {timer > 0 && <p className="mt-4">Time remaining: {timer} seconds</p>}
            {score !== null && (
                <p className="mt-4">
                    {score === 0 ? 'Complete! Your score is 0 CPM (Time ran out)' : `Complete! Your score is ${score} CPM`}
                </p>
            )}
        </section>
    );
}

export default Home;
