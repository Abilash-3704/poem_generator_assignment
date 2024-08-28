import React, {useState, useEffect, useRef} from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import {FaArrowRight, FaArrowDown} from 'react-icons/fa6';
import {
  motion,
  AnimatePresence,
  useInView,
  useAnimate,
  useAnimationControls,
  useScroll,
  useTransform,
} from 'framer-motion';
import Sentiment from 'sentiment';
import {Bar} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  scales,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);
const sentiment = new Sentiment();
const port = process.env.PORT || 8000;

const socket = io(`http://localhost:${port}`);

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [finalPrompt, setFinalPrompt] = useState('');
  const [poem, setPoem] = useState('');
  const [error, setError] = useState('');
  const [finalPoem, setFinalPoem] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptAnimationKey, setPromptAnimationKey] = useState(0);
  const [sentimentData, setSentimentData] = useState(null);
  const [positiveWordsData, setPositiveWordsData] = useState(null);
  const [negativeWordsData, setNegativeWordsData] = useState(null);
  const textareaRef = useRef(null);

  const chartRef = useRef(null);
  const pchartRef = useRef(null);
  const nchartRef = useRef(null);
  const mainRef = useRef(null);

  const [scope, animate] = useAnimate();
  const controls = useAnimationControls();
  //   const inView = useInView(chartRef, {once: true});
  const maininview = useInView(mainRef, {amount: 0.3, once: true});
  const isMobile = window.innerWidth <= 768;

  // Use useInView with once: true only on mobile screens
  const inView = useInView(chartRef, {amount: 0.5});
  const pinView = useInView(pchartRef, {amount: 0.5});
  const ninView = useInView(nchartRef, {amount: 0.5});

  useEffect(() => {
    const handleNewToken = data => {
      setPoem(prevPoem => prevPoem + data.token);
      setError('');
    };

    const handlePoemComplete = data => {
      setLoading(false);
      setFinalPoem(data.poem);
      analyzeEmotion(data.poem);
      setError('');
    };

    const handlePoemError = data => {
      setLoading(false);
      setError(data.error);
      console.error('Error generating poem:', data.error);
    };

    if (loading) {
      socket.on('new_token', handleNewToken);
      socket.on('poem_complete', handlePoemComplete);
      socket.on('poem_error', handlePoemError);
    }

    return () => {
      socket.off('new_token', handleNewToken);
      socket.off('poem_complete', handlePoemComplete);
      socket.off('poem_error', handlePoemError);
    };
  }, [loading]);

  const handleGeneratePoem = async () => {
    const textarea = textareaRef.current;
    const pt = textarea.value;

    textarea.value = null;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    setLoading(true);
    setPoem('');
    setShowPrompt(true);
    setPromptAnimationKey(prevKey => prevKey + 1);
    setFinalPrompt(prompt);

    try {
      await axios.post(`http://localhost:${port}/generate_poem`, {prompt});
    } catch (error) {
      console.error('Error generating poem:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleChange = e => {
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    setPrompt(e.target.value);
  };

  useEffect(() => {
    const adjustTextareaHeight = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    };

    window.addEventListener('resize', adjustTextareaHeight);
    adjustTextareaHeight();

    return () => {
      window.removeEventListener('resize', adjustTextareaHeight);
    };
  }, []);
  const analyzeEmotion = data => {
    const result = sentiment.analyze(data);
    const positiveScore = result.positive.length;
    const negativeScore = result.negative.length;

    const sentimentScores = {
      positive: positiveScore,
      negative: negativeScore,
    };

    const positiveWordsCount = result.positive.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
    const negativeWordsCount = result.negative.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
    setPositiveWordsData(positiveWordsCount);
    setNegativeWordsData(negativeWordsCount);
    setSentimentData(sentimentScores);
  };

  useEffect(() => {
    if (inView && scope.current) {
      animate(
        scope.current,
        {opacity: 1, scale: 1},
        {duration: 0.5, ease: 'easeOut'},
      );
    }
    console.log(inView);
  }, [inView, animate, scope]);
  useEffect(() => {
    if (prompt === '') {
      setShowPrompt(false);
    }
  }, [prompt, showPrompt]);
  const chartData = {
    labels: ['Positive', 'Negative'],
    datasets: [
      {
        data: sentimentData
          ? [sentimentData.positive, sentimentData.negative]
          : [0, 0],
        backgroundColor: ['#4CAF50', '#F44336'],
        barThickness: () => {
          const width = window.innerWidth;
          if (width < 640) return 8;
          if (width < 1024) return 20;
          return 30;
        },
      },
    ],
  };

  const positiveWordsChartData = {
    labels: positiveWordsData ? Object.keys(positiveWordsData) : [],
    datasets: [
      {
        label: 'Positive Words',
        data: positiveWordsData ? Object.values(positiveWordsData) : [],
        backgroundColor: '#4CAF50',
        barThickness: () => {
          const width = window.innerWidth;
          if (width < 640) return 8;
          if (width < 1024) return 20;
          return 30;
        },
      },
    ],
  };
  const negativeWordsChartData = {
    labels: negativeWordsData ? Object.keys(negativeWordsData) : [],
    datasets: [
      {
        label: 'Negative Words',
        data: negativeWordsData ? Object.values(negativeWordsData) : [],
        backgroundColor: '#F44336',
        barThickness: () => {
          const width = window.innerWidth;
          if (width < 640) return 8;
          if (width < 1024) return 20;
          return 30;
        },
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeInOutCubic',
    },

    plugins: {
      legend: {
        display: false,
        position: () => {
          const width = window.innerWidth;
          if (width < 640) return 'top';
          if (width < 1024) return 'top';
          return 'right';
        },

        labels: {
          font: {
            family: 'Montserrat',
            size: 14,
          },
          color: '#000000',
          padding: 20,
        },
      },
      title: {
        display: true,
        text: 'Emotion Analysis',
        color: '#000000',
        padding: 30,
        font: {
          family: 'Montserrat',
          size: () => {
            const width = window.innerWidth;
            if (width < 640) return 10;
            // if (width < 1024)
            return 14;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#000000',
          font: {
            family: 'Montserrat',
            size: () => {
              const width = window.innerWidth;
              if (width < 640) return 10;

              return 14;
            },
          },
        },
        grid: {
          color: '#000000',
        },
      },
      y: {
        ticks: {
          color: '#000000',
          font: {
            family: 'Montserrat',
            size: () => {
              const width = window.innerWidth;
              if (width < 640) return 10;
              // if (width < 1024) return 10;
              return 14;
            },
          },
        },
        grid: {
          color: '#000000',
        },
      },
    },
  };
  const positiveWordsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeInOutBounce',
    },
    plugins: {
      legend: {
        position: () => {
          const width = window.innerWidth;
          if (width < 640) return 'top';
          if (width < 1024) return 'top';
          return 'right';
        },
        labels: {
          color: '#ffffff',
          padding: 20,
          font: {
            family: 'Montserrat',

            size: () => {
              const width = window.innerWidth;
              if (width < 640) return 10;
              // if (width < 1024) return 10;
              return 14;
            },
          },
        },
        padding: 20,

        pointStyle: 'circle',
      },
      title: {
        display: true,
        text: 'Positive Words Count',

        color: '#ffffff',
        padding: 30,
        font: {
          family: 'Montserrat',
          size: () => {
            const width = window.innerWidth;
            if (width < 640) return 10;
            // if (width < 1024) return 10;
            return 14;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#ffffff',
          font: {
            family: 'Montserrat',
            size: () => {
              const width = window.innerWidth;
              if (width < 640) return 10;
              // if (width < 1024) return 10;
              return 14;
            },
          },
        },
        grid: {
          color: '#ffffff',
        },
      },
      y: {
        ticks: {
          color: '#ffffff',
          font: {
            family: 'Montserrat',
            size: () => {
              const width = window.innerWidth;
              if (width < 640) return 10;
              // if (width < 1024) return 10;
              return 14;
            },
          },
        },
        grid: {
          color: '#ffffff',
        },
      },
    },
  };
  const negativeWordsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    animation: {
      duration: 2000,
      easing: 'easeInOutBack',
    },
    plugins: {
      legend: {
        position: () => {
          const width = window.innerWidth;
          if (width < 640) return 'top';
          if (width < 1024) return 'top';
          return 'right';
        },
        labels: {
          color: '#000000',
          padding: 20,
          font: {
            family: 'Montserrat',
            //
            size: () => {
              const width = window.innerWidth;
              if (width < 640) return 10;
              // if (width < 1024) return 10;
              return 14;
            },
          },
        },
        padding: 20,
      },
      title: {
        display: true,
        text: 'Negative Words Count',
        color: '#000000',
        padding: 30,
        font: {
          family: 'Montserrat',
          //
          size: () => {
            const width = window.innerWidth;
            if (width < 640) return 10;
            // if (width < 1024) return 10;
            return 14;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#000000',
          font: {
            family: 'Montserrat',
            size: () => {
              const width = window.innerWidth;
              if (width < 640) return 10;
              // if (width < 1024) return 10;
              return 14;
            },
          },
        },
        grid: {
          color: '#000000',
        },
      },
      y: {
        ticks: {
          color: '#000000',
          font: {
            family: 'Montserrat',
            size: () => {
              const width = window.innerWidth;
              if (width < 640) return 10;
              // if (width < 1024) return 10;
              return 14;
            },
          },
        },
        grid: {
          color: '#000000',
        },
      },
    },
  };

  return (
    <>
      <div id="poem">
        <div ref={mainRef} className="">
          <div className="flex flex-col md:items-center bg-black text-white min-h-screen p-5">
            {maininview && (
              <motion.h1
                className="text-2xl text-center sm:text-4xl xl:text-8xl font-Mont p-6 "
                initial={{opacity: 0, y: -1}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 2.5}}>
                Poem Generator
              </motion.h1>
            )}

            {maininview && (
              <motion.div
                className="flex flex-col md:justify-center md:items-center px-6 md:w-9/12 bg-black text-white rounded-lg"
                initial={{opacity: 0, scale: 0.8}}
                animate={{opacity: 1, scale: 1}}
                transition={{duration: 1.5}}>
                <div className="flex items-center w-full border border-black-300 rounded-lg resize-none overflow-hidden focus:ring-black-500 focus:outline-none  bg-white">
                  <motion.textarea
                    ref={textareaRef}
                    className="text-black w-full font-Mont p-4 text-sm md:text-md xl:text-base resize-none overflow-hidden focus:ring-black-500 focus:outline-none "
                    // value={prompt}
                    onChange={handleChange}
                    style={{minHeight: '3rem', maxHeight: '10rem'}}
                    placeholder="Enter your prompt here"
                    rows="1"
                    initial={{x: '-100vw'}}
                    animate={{x: 0}}
                    transition={{type: 'spring', stiffness: 80}}
                  />
                  <motion.button
                    className="p-2 bg-black-500 text-black rounded-full disabled:opacity-50 flex items-center justify-center ml-2"
                    onClick={handleGeneratePoem}
                    disabled={loading}
                    initial={{opacity: 0, scale: 0.8}}
                    animate={{opacity: 1, scale: 1}}
                    transition={{duration: 0.5}}>
                    {loading ? (
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                    ) : (
                      <FaArrowRight className="h-5 w-5" />
                    )}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {showPrompt && finalPrompt && (
                    <motion.div
                      className="mt-4 self-end p-3 bg-gray-600 text-white font-Mont rounded-lg max-w-72 text-sm md:max-w-sm lg:max-w-xl md:text-lg overflow-wrap break-words"
                      key={promptAnimationKey}
                      initial={{opacity: 0, x: 20}}
                      animate={{opacity: 1, x: 0}}
                      transition={{duration: 0.5, ease: 'easeOut'}}>
                      <p>{finalPrompt}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {poem && (
                    <motion.div
                      className="font-Space rounded-lg bg-zinc-900 p-4 mb-5 text-base md:text-xl md:text-center mt-4 whitespace-pre-wrap"
                      initial={{opacity: 0, y: -50}}
                      animate={{opacity: 1, y: 0}}
                      exit={{opacity: 0, y: 50}}
                      transition={{duration: 1}}>
                      {poem
                        .split('\n')
                        .filter(line => line.trim() !== '')
                        .map((line, index) => (
                          <motion.p
                            key={index}
                            initial={{opacity: 0, x: -30}}
                            animate={{opacity: 1, x: 0}}
                            transition={{duration: 0.3, delay: index * 0.1}}>
                            {line}
                          </motion.p>
                        ))}
                    </motion.div>
                  )}
                  {error && (
                    <div className="font-Raleway text-white text-base md:text-xl md:text-center mt-4 whitespace-pre-wrap">
                      {error}
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
          {/* )} */}
        </div>

        <div
          ref={chartRef}
          className="flex flex-col items-center   w-full h-screen justify-center">
          {inView && (
            <motion.div
              className="w-2/3 h-2/3"
              initial={{opacity: 0, x: -50}}
              animate={{opacity: 1, x: 0}}
              transition={{duration: 0.25}}>
              <Bar
                data={chartData}
                options={chartOptions}
                className="w-full h-full"
              />
            </motion.div>
          )}
        </div>
        <div
          ref={pchartRef}
          className="flex flex-col items-center bg-black w-full h-screen justify-center">
          {pinView && (
            <motion.div
              className="w-2/3 h-2/3"
              initial={{opacity: 0, x: 50}}
              animate={{opacity: 1, x: 0}}
              transition={{duration: 0.25}}>
              <Bar
                data={positiveWordsChartData}
                options={positiveWordsChartOptions}
                className="w-full h-full"
              />
            </motion.div>
          )}
        </div>
        <div
          ref={nchartRef}
          className="flex flex-col items-center w-full h-screen justify-center">
          {ninView && (
            <motion.div
              className="w-2/3 h-2/3"
              initial={{opacity: 0, x: -50}}
              animate={{opacity: 1, x: 0}}
              transition={{duration: 0.25}}>
              <Bar
                data={negativeWordsChartData}
                options={negativeWordsChartOptions}
                className="w-full h-full"
              />
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
