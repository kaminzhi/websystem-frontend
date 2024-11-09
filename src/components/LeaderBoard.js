import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaChevronDown, FaChevronUp, FaSearch, FaPlusCircle, FaTimes } from 'react-icons/fa';
import axios from 'axios'; // 確保已安裝 axios

const games = [
  { id: 'game_1', displayName: '轉頭照樣射' },
  { id: 'game_2', displayName: '一定是大拇指的啦' },
  { id: 'game_3', displayName: '廚神擋道' },
  { id: 'game_4', displayName: '最速大天才' },
  { id: 'game_5', displayName: '誰是棋靈王' },
];

// 頁面切換動畫
const pageVariants = {
  initial: {
    opacity: 0,
    y: "50vh",
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: "-50vh",
  },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5,
};

function LeaderBoard({ setIsAuthenticated }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [containerHeight, setContainerHeight] = useState("auto");
  const [newScore, setNewScore] = useState('');
  const containerRef = useRef(null);
  const [showNickname, setShowNickname] = useState({});
  const [notification, setNotification] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [isNickname, setIsNickname] = useState(false);
  const [displayNameType, setDisplayNameType] = useState({}); // 0為真名，1為暱稱
  const [currentPlayerName, setCurrentPlayerName] = useState('');
  const [currentPlayerNickname, setCurrentPlayerNickname] = useState('');
  const [timeInput, setTimeInput] = useState({ minutes: '', seconds: '' });

  const fetchLeaderboardData = useCallback(async (gameName) => {
    try {
      const response = await axios.post('/api/players/search', { 
        gameName,
        lastUpdateTime
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      return [];
    }
  }, [lastUpdateTime]);

  useEffect(() => {
    // 自動獲取排行榜數據
    const fetchData = async () => {
      if (selectedGame) {
        const data = await fetchLeaderboardData(selectedGame);
        if (data.length > 0) {
          const rankedData = data
            .map((player) => ({ 
              ...player, 
              rank: player.score > 0 ? player.score : null 
            }))
            .sort((a, b) => {
              // 如果分數為 0，排在最後
              if (a.score === 0) return 1;
              if (b.score === 0) return -1;
              
              // 對於 game_4 和 game_5，時間越短排名越前
              if (selectedGame === 'game_4' || selectedGame === 'game_5') {
                return a.score - b.score;
              }
              // 其他遊戲保持原來的排序（分數越高排名越前）
              return b.score - a.score;
            });

          let currentRank = 0;
          let lastScore = null;

          const finalData = rankedData.map((player, index) => {
            if (player.score === 0) {
              return { ...player, rank: null }; // 分數為 0 的不顯示排名
            }
            
            if (player.score !== lastScore) {
              currentRank = index + 1;
            }
            lastScore = player.score;
            return { ...player, rank: currentRank };
          });

          setLeaderboardData(prevData => ({
            ...prevData,
            [selectedGame]: finalData
          }));
        }
      }
    };

    fetchData();
  }, [selectedGame, fetchLeaderboardData]);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.scrollHeight);
    }
  }, [showAll, selectedGame, searchTerm]);

  const handleGameSelect = (game) => {
    if (selectedGame === game) {
      setIsOpen(!isOpen);
    } else {
      setSelectedGame(game);
      setIsOpen(true);
    }
    setShowAll(false);
    setSearchTerm('');
  };

  const contentVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: containerHeight,
      transition: { 
        height: { duration: 0.5, ease: "easeInOut" },
        opacity: { duration: 0.3, delay: 0.2 }
      }
    }
  };

  const getMedalColor = (rank) => {
    switch(rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  const filteredData = useMemo(() => {
    if (!selectedGame || !leaderboardData[selectedGame]) return [];
    return leaderboardData[selectedGame].filter(player => 
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.nickname && player.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [selectedGame, leaderboardData, searchTerm]);

  const handlePlayerClick = (player) => {
    if (player.nickname) {
      const displayName = displayNameType[player.name] === 0 ? player.name : player.nickname;
      setSearchTerm(displayName);
      setCurrentPlayerName(player.name);
      setCurrentPlayerNickname(player.nickname);
      setIsNickname(displayNameType[player.name] !== 0);
    } else {
      setSearchTerm(player.name);
      setCurrentPlayerName(player.name);
      setCurrentPlayerNickname('');
      setIsNickname(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsNickname(false); // 重置為 false，因為用戶手動輸入時我們不知道是否為暱稱
  };

  const updateLeaderboard = useCallback(async () => {
    if (selectedGame) {
      const data = await fetchLeaderboardData(selectedGame);
      if (data.length > 0) {
        setLeaderboardData(prevData => ({
          ...prevData,
          [selectedGame]: data.map((player, index) => ({
            ...player,
            rank: player.score > 0 ? index + 1 : null
          }))
        }));
        setLastUpdateTime(Date.now());
      }
    }
  }, [selectedGame, fetchLeaderboardData]);

  const handleScoreSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (selectedGame && searchTerm) {
      let score;
      
      if (selectedGame === 'game_4' || selectedGame === 'game_5') {
        // 驗證時間輸入
        if (!timeInput.minutes && !timeInput.seconds) {
          setErrorMessage('請輸入有效的時間');
          return;
        }
        const minutes = parseInt(timeInput.minutes) || 0;
        const seconds = parseInt(timeInput.seconds) || 0;
        if (seconds >= 60) {
          setErrorMessage('秒數必須小於60');
          return;
        }
        score = minutes * 60 + seconds;
      } else {
        if (!newScore) {
          setErrorMessage('請輸入分數');
          return;
        }
        score = parseInt(newScore);
      }

      try {
        const displayType = currentPlayerNickname && displayNameType[currentPlayerName] === 1 ? 1 : 0;
        
        const requestData = {
          gameName: selectedGame,
          playerName: displayType === 0 ? currentPlayerName : null,
          nickname: displayType === 1 ? currentPlayerNickname : null,
          newScore: score,
          displayType: displayType
        };

        console.log('Sending request with data:', requestData);

        await axios.put('/api/players/update-score', requestData);
        
        // 顯示成功通知
        setNotification('分數更新成功');
        setTimeout(() => setNotification(null), 3000);

        // 重新獲取數據以更新排行榜
        await updateLeaderboard();
        
        // 重置所有玩家的顯示狀態為顯示暱稱(1)
        setDisplayNameType({});
        
        setNewScore('');
        setSearchTerm('');
        setCurrentPlayerName('');
        setCurrentPlayerNickname('');
      } catch (error) {
        console.error('Error updating score:', error);
        setErrorMessage(error.response?.data?.message || '更新分數時發生錯誤');
      }
    }
  }, [selectedGame, newScore, searchTerm, timeInput, updateLeaderboard, currentPlayerName, currentPlayerNickname, displayNameType]);

  const toggleName = (playerName) => {
    setDisplayNameType(prev => {
      const newState = { ...prev };
      if (newState[playerName] === 0) {
        // 如果當前是顯示真名(0)，切換為暱稱(1)
        newState[playerName] = 1;
        if (searchTerm === currentPlayerName) {
          setSearchTerm(currentPlayerNickname);
          setIsNickname(true);
        }
      } else {
        // 如果當前是顯示暱稱(1)或未設置，將所有玩家設為暱稱(1)，當前玩家設為真名(0)
        Object.keys(newState).forEach(key => {
          newState[key] = 1;
        });
        newState[playerName] = 0;
        if (searchTerm === currentPlayerNickname) {
          setSearchTerm(currentPlayerName);
          setIsNickname(false);
        }
      }
      return newState;
    });
  };

  const formatScore = (score, gameId) => {
    if (score === 0) return '無分數';
    
    // 對於 game_4 和 game_5，將分數轉換為時間格式
    if (gameId === 'game_4' || gameId === 'game_5') {
      const minutes = Math.floor(score / 60);
      const seconds = score % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // 其他遊戲保持原來的分數顯示
    return score.toString().padStart(4, ' ');
  };

  const renderScoreInput = () => {
    if (selectedGame === 'game_4' || selectedGame === 'game_5') {
      return (
        <div className="flex space-x-2 items-center">
          <input
            type="number"
            placeholder="分"
            value={timeInput.minutes}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || (parseInt(value) >= 0 && parseInt(value) < 60)) {
                setTimeInput(prev => ({ ...prev, minutes: value }));
              }
            }}
            min="0"
            max="59"
            className="w-16 px-2 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-600">分</span>
          <input
            type="number"
            placeholder="秒"
            value={timeInput.seconds}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || (parseInt(value) >= 0 && parseInt(value) < 60)) {
                setTimeInput(prev => ({ ...prev, seconds: value }));
              }
            }}
            min="0"
            max="59"
            className="w-16 px-2 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-600">秒</span>
        </div>
      );
    }

    return (
      <input
        type="number"
        placeholder="分數"
        value={newScore}
        onChange={(e) => setNewScore(e.target.value)}
        className="w-24 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  };

  // 找到對應遊戲的顯示名稱
  const getGameDisplayName = (gameId) => {
    const game = games.find(g => g.id === gameId);
    return game ? game.displayName : gameId;
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="bg-gray-100 min-h-screen py-12 flex justify-center"
    >
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <h1 className="text-4xl font-bold text-center text-white">遊戲排行榜</h1>
          </div>
          
          <div className="p-6">
            <div className="mb-8 flex flex-wrap justify-center">
              {games.map((game) => (
                <motion.button
                  key={game.id}
                  className={`px-4 py-2 m-1 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedGame === game.id 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => handleGameSelect(game.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {game.displayName}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isOpen && selectedGame && leaderboardData[selectedGame] && (
            <motion.div
              key={selectedGame}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={contentVariants}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">
                  {getGameDisplayName(selectedGame)} 排行榜
                </h2>
                
                <form onSubmit={handleScoreSubmit} className="mb-4 flex items-center space-x-2">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      placeholder="搜索或輸入玩家名稱"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full px-4 py-2 pl-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  </div>
                  {renderScoreInput()}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <FaPlusCircle />
                  </button>
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full font-mono">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-1/6">排名</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-1/3">玩家</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-1/3">系班級</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-1/6">分數</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredData.slice(0, showAll ? undefined : 10).map((player, index) => (
                        <tr
                          key={index}
                          className={`${player.rank && player.rank <= 3 ? 'bg-blue-white' : 'bg-white'} cursor-pointer hover:bg-gray-100`}
                          onClick={() => handlePlayerClick(player)}
                        >
                          <td className="px-4 py-4 whitespace-nowrap w-1/6">
                            <div className="flex items-center justify-center">
                              {player.score === 0 ? (
                                <span className="text-sm text-gray-500">無</span>
                              ) : (
                                <span className="text-sm text-gray-600">{player.rank ? player.rank.toString().padStart(3, ' ') : '無'}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 w-1/3 text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {player.nickname ? (
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                                  <span>{displayNameType[player.name] === 0 ? player.name : player.nickname}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleName(player.name);
                                    }}
                                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors duration-200 whitespace-nowrap"
                                  >
                                    {displayNameType[player.name] === 0 ? '顯示暱稱' : '顯示真名'}
                                  </button>
                                </div>
                              ) : (
                                player.name
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 w-1/3 text-center">
                            <div className="text-sm text-gray-900">
                              {player.department || '未設置'}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center w-1/6">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatScore(player.score, selectedGame)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredData.length > 10 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {showAll ? (
                        <>
                          收起 <FaChevronUp className="ml-2" />
                        </>
                      ) : (
                        <>
                          查看更多 <FaChevronDown className="ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 懸浮通 */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg"
            >
              {notification}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 錯誤對話框 */}
        {errorMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">錯誤</h3>
                <button onClick={() => setErrorMessage(null)} className="text-gray-500 hover:text-gray-700">
                  <FaTimes />
                </button>
              </div>
              <p className="text-gray-600 mb-4">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition duration-200"
              >
                關閉
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
export default LeaderBoard;
