import React, {useEffect, useState, useRef} from 'react';
import {motion, useInView} from 'framer-motion';
import {FaArrowDown} from 'react-icons/fa';

import '../index.css';
export default function Landing() {
  const landingRef = useRef(null);

  const inView = useInView(landingRef, {amount: 0.3});
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleScroll = targetId => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      ref={landingRef}
      className={`bg-black text-white w-full h-screen flex flex-col items-center justify-center  font-Mont relative overflow-hidden`}>
      {inView && (
        <>
          <motion.h1
            className={`text-center p-4  text-4xl md:text-6xl xl:text-8xl font-bold z-10 gradient-text`}
            initial={{opacity: 0, x: -100}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.75}}>
            Out of Ideas for your next poem??
          </motion.h1>
          <motion.h1
            className={`text-center p-4  text-4xl md:text-6xl xl:text-8xl font-bold z-10 gradient-text`}
            initial={{opacity: 0, x: 100}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.75, delay: 0.5}}>
            We got you covered
          </motion.h1>

          <motion.div
            className=""
            initial={{opacity: 0, y: -100}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.75, delay: 1}}>
            <motion.button
              className={`mt-8 p-4 bg-black-500 text-white rounded-full shadow-lg z-10 flex items-center  justify-center`}
              onClick={() => handleScroll('poem')}
              initial={{opacity: 1, y: 50}}
              animate={{
                y: [0, 10, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: 'mirror', // Ensures it moves back and forth
                ease: 'easeInOut',
              }}>
              <FaArrowDown className="h-10 w-10 " />
            </motion.button>
          </motion.div>
        </>
      )}
    </div>
  );
}
