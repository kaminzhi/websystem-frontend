import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import axios from 'axios';
import './Home.css';

const gamesList = [
  { id: 'game_1', name: "轉頭照樣射" },
  { id: 'game_2', name: "一定是大拇指的啦" },
  { id: 'game_3', name: "廚神擋道" },
  { id: 'game_4', name: "最速大天才" },
  { id: 'game_5', name: "誰是棋靈王" }
];

function Home() {
  const [time, setTime] = useState(new Date());
  const [currentGame, setCurrentGame] = useState(0);
  const [revealedRanks, setRevealedRanks] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);
  const [allGamesRevealed, setAllGamesRevealed] = useState(false);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // 格式化分數顯示
  const formatScore = (score, gameId) => {
    if (score === 0) return '0';
    
    // 對於 game_4 和 game_5，將分數轉換為時間格式
    if (gameId === 'game_4' || gameId === 'game_5') {
      const minutes = Math.floor(score / 60);
      const seconds = score % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return score;
  };

  // 獲取排行榜數據
  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const gamesData = await Promise.all(
        gamesList.map(async (game) => {
          const response = await axios.post('/api/players/search', { gameName: game.id });
          const players = response.data;
          
          // 根據遊戲類型排序
          const sortedPlayers = players.sort((a, b) => {
            if (a.score === 0) return 1;
            if (b.score === 0) return -1;
            
            if (game.id === 'game_4' || game.id === 'game_5') {
              return a.score - b.score;
            }
            return b.score - a.score;
          });

          // 只取前三名
          const winners = sortedPlayers.slice(0, 3).map((player, index) => ({
            rank: index + 1,
            name: player.nickname || player.name,
            score: player.score
          }));

          return {
            name: game.name,
            id: game.id,
            winners
          };
        })
      );

      setGames(gamesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
    const interval = setInterval(fetchLeaderboardData, 30000); // 每30秒更新一次
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  const handleReveal = () => {
    if (revealedRanks < 3) {
      setRevealedRanks(prevRanks => prevRanks + 1);
      if (revealedRanks === 2) {
        setTimeout(() => {
          setShowFireworks(true);
          const duration = 15 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

          const randomInRange = (min, max) => Math.random() * (max - min) + min;

          const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
              return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
          }, 250);
        }, 500);
      }
    } else {
      if (currentGame < games.length - 1) {
        setRevealedRanks(0);
        setShowFireworks(false);
        setCurrentGame(prevGame => prevGame + 1);
      } else {
        setAllGamesRevealed(true);
        const end = Date.now() + (15 * 1000);

        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];

        (function frame() {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50, 
      scale: 0.3,
      rotateX: -90
    },
    visible: (custom) => ({ 
      opacity: 1, 
      y: 0, 
      scale: 1,
      rotateX: 0,
      transition: { 
        type: 'spring', 
        bounce: 0.4, 
        duration: 0.8,
        delay: custom * 0.2
      }
    })
  };

  const renderWinners = (gameIndex) => {
    const currentGame = games[gameIndex];
    if (!currentGame) return null;

    return currentGame.winners.sort((a, b) => a.rank - b.rank).map((player, index) => (
      <motion.div
        key={`${gameIndex}-${player.rank}`}
        custom={index}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className={`w-full max-w-md mb-6 p-6 rounded-lg shadow-2xl ${
          player.rank === 1 ? 'bg-gradient-to-r from-yellow-300 to-yellow-500' :
          player.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
          'bg-gradient-to-r from-orange-300 to-orange-500'
        } transform hover:scale-105 transition duration-300`}
      >
        <div className="text-3xl font-bold mb-2 text-black text-center">第 {player.rank} 名</div>
        <div className="text-2xl mb-1 text-black text-center">{player.name}</div>
        <div className="text-xl text-black text-center">
          {currentGame.id === 'game_4' || currentGame.id === 'game_5' ? (
            <>時間: {formatScore(player.score, currentGame.id)}</>
          ) : (
            <>得分: {formatScore(player.score, currentGame.id)}</>
          )}
        </div>
        {player.rank === 1 && <div className="crown">👑</div>}
      </motion.div>
    ));
  };

  if (loading) {
    return (
      <div className="container mx-auto mt-8 text-center">
        <div className="text-2xl text-blue-600">載入中...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto mt-8 text-center relative overflow-hidden"
    >
      <div className="stars"></div>
      <h1 className="text-4xl font-bold mb-4 text-yellow-500">首頁</h1>
      <div className="mt-10">
        <motion.div
          className="text-8xl font-bold text-blue-600 glow"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {formatTime(time)}
        </motion.div>
      </div>
      {!allGamesRevealed ? (
        <>
          <motion.h2 
            className="text-3xl font-bold mt-8 mb-4 text-black"
            key={currentGame}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            {games[currentGame].name}
          </motion.h2>
          <div className="mt-10">
            <motion.button
              onClick={handleReveal}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full text-xl shadow-lg transform hover:scale-105 transition duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {revealedRanks === 3 ? '切換' : '揭曉下一名'}
            </motion.button>
          </div>
          <div className="mt-10 flex flex-col-reverse items-center">
            <AnimatePresence>
              {games[currentGame].winners.slice(0, revealedRanks).map((player, index) => renderWinners(currentGame)[2 - index])}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className="mt-10 flex justify-between items-start gap-4 overflow-x-auto px-4">
          {games.map((game, index) => (
            <div key={index} className="flex-shrink-0 w-[250px]">
              <h3 className="text-2xl font-bold mb-4 text-black">{game.name}</h3>
              {renderWinners(index)}
            </div>
          ))}
        </div>
      )}
      {showFireworks && (
        <div className="fireworks">
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
        </div>
      )}
    </motion.div>
  );
}

export default Home;
