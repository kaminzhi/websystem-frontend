import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaMedal, FaGamepad } from 'react-icons/fa';

function LiveRanking() {
  const [rankings, setRankings] = useState({});
  const [games, setGames] = useState([
    { id: 'game_1', displayName: '轉頭照樣射' },
    { id: 'game_2', displayName: '一定是大拇指的啦' },
    { id: 'game_3', displayName: '廚神擋道' },
    { id: 'game_4', displayName: '最速大天才' },
    { id: 'game_5', displayName: '誰是棋靈王' },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 獲取所有遊戲的排名數據
  const fetchAllRankings = async () => {
    try {
      setError(null);
      // 獲取所有遊戲的排名
      const rankingsPromises = games.map(game => 
        axios.post('/api/players/search', { gameName: game.id })
      );

      const rankingsResponses = await Promise.all(rankingsPromises);
      
      // 整理每個遊戲的排名數據
      const newRankings = {};
      rankingsResponses.forEach((response, index) => {
        const gameData = games[index];
        const players = response.data.slice(0, 10); // 只取前10名

        // 根據遊戲類型排序
        const sortedPlayers = players.sort((a, b) => {
          // 如果分數為 0，排在最後
          if (a.score === 0) return 1;
          if (b.score === 0) return -1;
          
          // 對於 game_3 和 game_4，時間越短排名越前
          if (gameData.id === 'game_3' || gameData.id === 'game_4') {
            return a.score - b.score;
          }
          // 其他遊戲保持原來的排序（分數越高排名越前）
          return b.score - a.score;
        });

        let currentRank = 0;
        let lastScore = null;

        const rankedPlayers = sortedPlayers.map((player, idx) => {
          if (player.score === 0) {
            return { ...player, rank: null }; // 分數為 0 的不顯示排名
          }
          
          if (player.score !== lastScore) {
            currentRank = idx + 1;
          }
          lastScore = player.score;
          return { ...player, rank: currentRank };
        });

        newRankings[gameData.id] = rankedPlayers; // 設置遊戲的排名數據
      });

      setRankings(newRankings);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      setError('獲取排名數據時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 初始加載和定期更新
  useEffect(() => {
    fetchAllRankings();
    const interval = setInterval(fetchAllRankings, 5000); // 每5秒更新一次
    return () => clearInterval(interval);
  }, []);

  // 獎牌顏色
  const getMedalColor = (rank) => {
    switch (rank) {
      case 1: return 'text-yellow-500'; // 金
      case 2: return 'text-gray-400';   // 銀
      case 3: return 'text-yellow-600'; // 銅
      default: return 'text-gray-600';
    }
  };

  const formatScore = (score, gameId) => {
    if (score === 0) return '無分數';
    
    // 對於 game_3 和 game_4，將分數轉換為時間格式
    if (gameId === 'game_3' || gameId === 'game_4') {
      const minutes = Math.floor(score / 60);
      const seconds = score % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // 其他遊戲保持原來的分數顯示
    return score;
  };

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
        <button 
          onClick={fetchAllRankings}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          重試
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin text-blue-500 text-4xl mb-4">⌛</div>
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4"
    >
      <h1 className="text-4xl font-bold text-center mb-8 text-blue-600">
        遊戲排行榜
      </h1>

      <div className="flex flex-col md:flex-row justify-center overflow-x-auto gap-4 pb-4">
        {games.map(game => (
          <div 
            key={game.id}
            className="flex-none w-full md:w-80 bg-white rounded-lg shadow-lg p-4"
          >
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800 flex items-center justify-center">
              <FaGamepad className="mr-2" />
              {game.displayName}
            </h2>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {rankings[game.id]?.map((player, index) => (
                  <motion.div
                    key={player.name}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 50
                    }}
                    className={`p-3 rounded-lg flex items-center ${player.rank && player.rank <= 3 ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-gray-200'}`}
                  >
                    {/* 排名 */}
                    <div className="w-8 text-center">
                      {player.rank ? (
                        <span className="text-lg font-bold">{player.rank}</span>
                      ) : (
                        <span className="text-sm text-gray-500">無</span>
                      )}
                    </div>

                    {/* 玩家資訊 */}
                    <div className="flex-grow ml-2">
                      <div className="font-bold text-sm">
                        {player.nickname || player.name}
                      </div>
                      <div className="text-xs opacity-75">
                        {player.department || '未設置系級'}
                      </div>
                    </div>

                    {/* 分數 */}
                    <motion.div 
                      className="text-lg font-bold ml-2"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.3 }}
                    >
                      {formatScore(player.score, game.id)}
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* 數據提示 */}
              {(!rankings[game.id] || rankings[game.id].length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  暫無排名數據
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default LiveRanking;