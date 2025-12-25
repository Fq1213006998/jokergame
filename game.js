// 游戏状态管理
let gameState = {
    playerHand: [],
    aiHand: [],
    playerDiscard: [],
    aiDiscard: [],
    isPlayerTurn: true,
    gameStarted: false,
    difficulty: 'easy' // 默认难度为简单
};

// 卡牌数据结构
const cardValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const cardSuits = ['spades', 'hearts', 'diamonds', 'clubs'];
const jokerTypes = ['red', 'black'];

// DOM元素
const startScreen = document.getElementById('start-screen');
const battleScreen = document.getElementById('battle-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const playerHandElement = document.getElementById('player-hand');
const aiHandElement = document.getElementById('ai-hand');
const playerDiscardPile = document.getElementById('player-discard-pile');
const aiDiscardPile = document.getElementById('ai-discard-pile');
const playerCardCount = document.getElementById('player-card-count');
const aiCardCount = document.getElementById('ai-card-count');
const turnIndicator = document.getElementById('turn-indicator');
const resultTitle = document.getElementById('result-title');
const resultText = document.getElementById('result-text');
const restartBtn = document.getElementById('restart-btn');
const drawInfo = document.getElementById('draw-info');

// Minecraft风格日志系统
const logContent = document.getElementById('log-content');

// 日志系统初始化
function initMinecraftLogSystem() {
    if (logContent) {
        logContent.innerHTML = '';
        addMinecraftLog('游戏开始！', 'game');
    }
}

// 添加日志条目
function addMinecraftLog(message, type = 'system') {
    if (!logContent) return;
    
    // 创建日志条目元素
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.textContent = message;
    
    // 添加到日志容器
    logContent.appendChild(logEntry);
    
    // 自动滚动到底部
    setTimeout(() => {
        logContent.scrollTop = logContent.scrollHeight;
    }, 50);
    
    // 限制日志数量，保持性能
    if (logContent.children.length > 50) {
        logContent.removeChild(logContent.firstChild);
    }
}

// 初始化游戏
function initGame() {
    if (gameState.gameStarted) return;
    
    // 创建牌组
    const deck = createDeck();
    
    // 洗牌
    const shuffledDeck = shuffleDeck(deck);
    
    // 发牌
    dealCards(shuffledDeck);
    
    // 设置游戏开始状态
    gameState.gameStarted = true;
    
    // 更新界面
    updateDisplay();
}

// 创建一副完整的扑克牌
function createDeck() {
    const deck = [];
    
    // 添加普通牌
    for (let suitIndex = 0; suitIndex < cardSuits.length; suitIndex++) {
        for (let valueIndex = 0; valueIndex < cardValues.length; valueIndex++) {
            deck.push({
                id: suitIndex * cardValues.length + valueIndex + 1,
                value: cardValues[valueIndex],
                numericValue: valueIndex + 1,
                suit: cardSuits[suitIndex],
                image: getCardImage(suitIndex * cardValues.length + valueIndex + 1)
            });
        }
    }
    
    // 添加鬼牌
    deck.push({
        id: 53,
        value: 'Joker',
        numericValue: 0,
        suit: 'red',
        image: getCardImage(53)
    });
    
    deck.push({
        id: 54,
        value: 'Joker',
        numericValue: 0,
        suit: 'black',
        image: getCardImage(54)
    });
    
    return deck;
}

// 获取卡牌图片路径
function getCardImage(cardId) {
    // 参数验证
    if (typeof cardId !== 'number' || cardId < 1 || cardId > 54) {
        return `图片素材/扑克背面.png`;
    }
    
    if (cardId >= 1 && cardId <= 52) {
        // 转换卡牌ID为对应的图片文件名
        // 花色：1-4（黑桃、红心、梅花、方块）
        // 数值：1-d（A=1, 2-9=2-9, 10=a, J=b, Q=c, K=d）
        const suitIndex = Math.floor((cardId - 1) / 13) + 1; // 1-4
        const valueIndex = (cardId - 1) % 13 + 1; // 1-13
        
        // 转换数值为对应的字符
        let valueChar;
        if (valueIndex === 10) {
            valueChar = 'a';
        } else if (valueIndex === 11) {
            valueChar = 'b';
        } else if (valueIndex === 12) {
            valueChar = 'c';
        } else if (valueIndex === 13) {
            valueChar = 'd';
        } else {
            valueChar = valueIndex.toString();
        }
        
        const fileName = `${suitIndex}${valueChar}.JPG`;
        return `图片素材/扑克牌图片/${fileName}`;
    } else if (cardId === 53) {
        return `图片素材/扑克牌图片/大王.JPG`;
    } else if (cardId === 54) {
        return `图片素材/扑克牌图片/小王.JPG`;
    }
    
    // 默认返回背面图片
    return `图片素材/扑克背面.png`;
}

// 洗牌算法
function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 发牌
function dealCards(deck) {
    gameState.playerHand = deck.slice(0, 27);
    gameState.aiHand = deck.slice(27);
    
    // 检查并打出初始手牌中的对子
    checkAndDiscardPairs(gameState.playerHand, 'player');
    checkAndDiscardPairs(gameState.aiHand, 'ai');
}



// AI抽取玩家手牌
function aiTurn() {
    if (gameState.isPlayerTurn || gameState.playerHand.length === 0) return;
    
    // AI策略：优先抽取能形成对子的牌
    const bestCardIndex = findBestCardToDraw();
    const drawnCard = gameState.playerHand.splice(bestCardIndex, 1)[0];
    
    // 将抽到的牌加入AI手牌
    gameState.aiHand.push(drawnCard);
    
    // 显示AI抽取的卡牌信息
    const cardName = drawnCard.value === 'Joker' ? `${drawnCard.value} (${drawnCard.suit})` : `${drawnCard.value} of ${drawnCard.suit}`;
    showDrawInfo(`AI抽到了：${cardName}`);
    
    // 添加到Minecraft风格日志
    addMinecraftLog(`【AI】抽取了【${cardName}】`, 'ai');
    
    // 检查AI手牌中的对子
    checkAndDiscardPairs(gameState.aiHand, 'ai');
    
    // 检查游戏是否结束（AI可能在抽到牌后形成最后一对）
    if (checkGameEnd()) return;
    
    // 切换到玩家回合
    gameState.isPlayerTurn = true;
    
    // 更新界面
    updateDisplay();
}

// AI最优抽牌策略：优先抽取能与AI手牌形成对子的牌
function findOptimalCard() {
    // 统计AI手牌中每种数值的数量
    const aiValueCounts = {};
    gameState.aiHand.forEach(card => {
        const key = card.numericValue;
        aiValueCounts[key] = (aiValueCounts[key] || 0) + 1;
    });
    
    // 统计玩家手牌中每种数值的数量
    const playerValueCounts = {};
    gameState.playerHand.forEach(card => {
        const key = card.numericValue;
        playerValueCounts[key] = (playerValueCounts[key] || 0) + 1;
    });
    
    // 检查玩家手牌中是否有能与AI手牌形成对子的牌
    for (let i = 0; i < gameState.playerHand.length; i++) {
        const card = gameState.playerHand[i];
        if (aiValueCounts[card.numericValue]) {
            // 优先抽取鬼牌（如果有）
            if (card.numericValue === 0) {
                return i;
            }
        }
    }
    
    // 如果没有能与AI手牌形成对子的牌，检查玩家手牌中是否有鬼牌
    for (let i = 0; i < gameState.playerHand.length; i++) {
        if (gameState.playerHand[i].numericValue === 0) {
            return i;
        }
    }
    
    // 寻找玩家手牌中数量最多的牌值
    let maxCount = 0;
    let targetValue = null;
    for (const value in playerValueCounts) {
        if (playerValueCounts[value] > maxCount) {
            maxCount = playerValueCounts[value];
            targetValue = parseInt(value);
        }
    }
    
    // 如果找到了数量最多的牌值，优先抽取该牌值的牌
    if (targetValue !== null) {
        for (let i = 0; i < gameState.playerHand.length; i++) {
            if (gameState.playerHand[i].numericValue === targetValue) {
                return i;
            }
        }
    }
    
    // 如果以上策略都无法决定，随机抽取
    return Math.floor(Math.random() * gameState.playerHand.length);
}

// AI抽牌策略：根据难度调整策略
function findBestCardToDraw() {
    // 根据难度调整策略
    if (gameState.difficulty === 'easy') {
         if (Math.random() < 0.8) {
            return findOptimalCard(); // 最优策略
        } else {
            return Math.floor(Math.random() * gameState.playerHand.length); // 随机抽取
        }
    } else if (gameState.difficulty === 'medium') {
        if (Math.random() < 0.5) {
            return findOptimalCard(); // 最优策略
        } else {
            return Math.floor(Math.random() * gameState.playerHand.length); // 随机抽取
        }
    } else { // hard
        // 困难模式：AI随机抽取（让玩家更容易赢）
        return Math.floor(Math.random() * gameState.playerHand.length);
    }
}

// 检查并打出所有可能的对子
function checkAndDiscardPairs(hand, playerType) {
    // 参数验证
    if (!Array.isArray(hand) || hand.length === 0) return;
    if (playerType !== 'player' && playerType !== 'ai') return;
    
    // 重复检查直到没有更多对子可打
    let hasPairs;
    do {
        hasPairs = false;
        const valueCounts = {};
        const pairsToDiscard = [];
        
        // 统计每种数值的数量（排除鬼牌）
        hand.forEach((card, index) => {
            if (!card || typeof card.numericValue === 'undefined') return;
            // 鬼牌无法配对，始终保留
            if (card.value === 'Joker') return;
            const key = card.numericValue;
            if (!valueCounts[key]) {
                valueCounts[key] = [];
            }
            valueCounts[key].push(index);
        });
        
        // 找出所有对子
        for (const key in valueCounts) {
            if (valueCounts[key].length >= 2) {
                hasPairs = true;
                
                // 对于所有牌（包括鬼牌），每两张形成一个对子
                for (let i = 0; i < valueCounts[key].length; i += 2) {
                    if (i + 1 < valueCounts[key].length) {
                        pairsToDiscard.push(valueCounts[key][i]);
                        pairsToDiscard.push(valueCounts[key][i + 1]);
                    }
                }
            }
        }
        
        // 打出对子（从后往前删除，避免索引问题）
        if (pairsToDiscard.length > 0) {
            // 按降序排序，确保从后往前删除
            pairsToDiscard.sort((a, b) => b - a);
            
            // 记录打出的对子
            const discardedPairs = [];
            
            pairsToDiscard.forEach(index => {
                const discardedCard = hand.splice(index, 1)[0];
                discardedPairs.push(discardedCard);
                
                if (playerType === 'player') {
                    gameState.playerDiscard.push(discardedCard);
                } else {
                    gameState.aiDiscard.push(discardedCard);
                }
            });
            
            // 记录日志：每两张牌组成一对
            for (let i = 0; i < discardedPairs.length; i += 2) {
                if (i + 1 < discardedPairs.length) {
                    const pairValue = discardedPairs[i].value;
                    const playerText = playerType === 'player' ? '玩家' : 'AI';
                    addMinecraftLog(`【${playerText}】打出了对【${pairValue}】`, playerType);
                }
            }
        }
    } while (hasPairs);
}

// 检查游戏是否结束
function checkGameEnd() {
    if (gameState.playerHand.length === 0) {
        // 检查AI手牌是否有两张鬼牌
        const aiJokerCount = gameState.aiHand.filter(card => card.value === 'Joker').length;
        endGame('player', aiJokerCount === 2);
        return true;
    } else if (gameState.aiHand.length === 0) {
        // 检查玩家手牌是否有两张鬼牌
        const playerJokerCount = gameState.playerHand.filter(card => card.value === 'Joker').length;
        endGame('ai', playerJokerCount === 2);
        return true;
    }
    return false;
}

// 游戏结束
function endGame(winner, loserHasTwoJokers) {
    gameState.gameStarted = false;
    
    // 记录游戏结束日志
    if (winner === 'player') {
        if (loserHasTwoJokers) {
            addMinecraftLog('【游戏结束】玩家成功打空了手牌，AI手中持有两张鬼牌，玩家获胜！', 'game');
        } else {
            addMinecraftLog('【游戏结束】玩家成功打空了手牌，赢得了游戏！', 'game');
        }
    } else {
        if (loserHasTwoJokers) {
            addMinecraftLog('【游戏结束】AI打空了手牌，玩家手中持有两张鬼牌，AI获胜！', 'game');
        } else {
            addMinecraftLog('【游戏结束】AI打空了手牌，玩家失败！', 'game');
        }
    }
    
    // 显示结果界面
    battleScreen.classList.remove('active');
    resultScreen.classList.add('active');
    
    if (winner === 'player') {
        resultTitle.textContent = '恭喜你赢了！';
        if (loserHasTwoJokers) {
            resultText.textContent = '你成功打空了手牌，AI手中持有两张鬼牌，游戏结束！';
        } else {
            resultText.textContent = '你成功打空了手牌，赢得了游戏！';
        }
    } else {
        resultTitle.textContent = '游戏结束';
        if (loserHasTwoJokers) {
            resultText.textContent = 'AI打空了手牌，你手中持有两张鬼牌，游戏结束！';
        } else {
            resultText.textContent = 'AI打空了手牌，你输了！';
        }
    }
}

// 更新界面显示
function updateDisplay() {
    // 更新手牌显示
    updatePlayerHand();
    updateAiHand();
    
    // 更新弃牌堆显示
    updateDiscardPiles();
    
    // 更新手牌数量
    if (playerCardCount) {
        playerCardCount.textContent = gameState.playerHand.length;
    }
    if (aiCardCount) {
        aiCardCount.textContent = gameState.aiHand.length;
    }
    
    // 更新轮次指示器
    if (turnIndicator) {
        if (gameState.isPlayerTurn) {
            turnIndicator.textContent = '轮到你抽取AI卡牌';
            turnIndicator.style.color = '#2ecc71'; // 绿色
        } else {
            turnIndicator.textContent = 'AI正在抽取你的卡牌';
            turnIndicator.style.color = '#e74c3c'; // 红色
        }
    }
}

// 更新玩家手牌显示
function updatePlayerHand() {
    if (!playerHandElement) return;
    
    playerHandElement.innerHTML = '';
    
    gameState.playerHand.forEach((card, index) => {
        const cardElement = createCardElement(card, index, true);
        playerHandElement.appendChild(cardElement);
    });
}

// 更新AI手牌显示
function updateAiHand() {
    if (!aiHandElement) return;
    
    aiHandElement.innerHTML = '';
    
    gameState.aiHand.forEach((card, index) => {
        const cardElement = createCardElement(card, index, false);
        aiHandElement.appendChild(cardElement);
    });
}

// 更新弃牌堆显示
function updateDiscardPiles() {
    // 更新玩家弃牌堆
    if (playerDiscardPile) {
        playerDiscardPile.innerHTML = '';
        gameState.playerDiscard.forEach(card => {
            const cardElement = createCardElement(card, null, true, true);
            playerDiscardPile.appendChild(cardElement);
        });
    }
    
    // 更新AI弃牌堆
    if (aiDiscardPile) {
        aiDiscardPile.innerHTML = '';
        gameState.aiDiscard.forEach(card => {
            const cardElement = createCardElement(card, null, false, true);
            aiDiscardPile.appendChild(cardElement);
        });
    }
}

// 创建卡牌元素
function createCardElement(card, index, isPlayer, isDiscard = false) {
    // 参数验证
    if (!card || !card.image) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        return cardElement;
    }
    
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.dataset.cardIndex = index;
    cardElement.dataset.cardValue = card.value;
    cardElement.dataset.cardSuit = card.suit;
    
    if (isDiscard) {
        cardElement.style.backgroundImage = `url('${card.image}')`;
        cardElement.style.pointerEvents = 'none'; // 弃牌不可点击
    } else if (!isPlayer) {
        cardElement.classList.add('back');
        // AI的卡牌在玩家回合可点击
        if (gameState.isPlayerTurn && gameState.gameStarted) {
            cardElement.addEventListener('click', function(event) {
                handleAiCardClick(index, event);
            });
            cardElement.style.pointerEvents = 'auto';
            cardElement.style.cursor = 'pointer';
        } else {
            cardElement.style.pointerEvents = 'none';
            cardElement.style.cursor = 'default';
        }
    } else {
        cardElement.style.backgroundImage = `url('${card.image}')`;
        // 玩家的卡牌不可点击（玩家通过点击AI卡牌来抽取）
        cardElement.style.pointerEvents = 'none';
        cardElement.style.cursor = 'default';
    }
    
    return cardElement;
}

// 显示抽取卡牌信息
function showDrawInfo(message) {
    if (!drawInfo) return;
    
    drawInfo.textContent = message;
    drawInfo.classList.add('show');
    
    // 2秒后隐藏
    setTimeout(() => {
        drawInfo.classList.remove('show');
    }, 2000);
}

// 处理AI卡牌点击事件（玩家抽取AI卡牌）
function handleAiCardClick(index, event) {
    if (!gameState.isPlayerTurn || gameState.aiHand.length === 0) return;
    
    // 为点击的卡牌添加视觉反馈
    let cardElement = event.target;
    if (!cardElement.classList.contains('card')) {
        cardElement = cardElement.closest('.card');
    }
    
    cardElement.style.transform = 'scale(1.1)';
    
    // 延迟执行抽取逻辑，等待视觉反馈
    setTimeout(() => {
        cardElement.style.transform = '';
        
        // 从AI手牌中抽取选中的卡牌
        const drawnCard = gameState.aiHand.splice(index, 1)[0];
        
        // 将抽到的牌加入玩家手牌
        gameState.playerHand.push(drawnCard);
        
        // 显示抽取的卡牌信息
        const cardName = drawnCard.value === 'Joker' ? `${drawnCard.value} (${drawnCard.suit})` : `${drawnCard.value} of ${drawnCard.suit}`;
        showDrawInfo(`你抽到了：${cardName}`);
        
        // 添加到Minecraft风格日志
        addMinecraftLog(`【玩家】抽取了【${cardName}】`, 'player');
        
        // 检查玩家手牌中的对子
        checkAndDiscardPairs(gameState.playerHand, 'player');
        
        // 检查游戏是否结束（玩家可能在抽到牌后形成最后一对）
        if (checkGameEnd()) return;
        
        // 切换到AI回合
        gameState.isPlayerTurn = false;
        
        // 更新界面
        updateDisplay();
        
        // AI回合
        setTimeout(aiTurn, 2000); // 增加延迟，让玩家有时间看到抽取的牌
    }, 200);
}

// 处理玩家卡牌点击事件（现在可能不再需要，但保留作为备用）
function handlePlayerCardClick(card, index, event) {
    console.log('玩家点击了自己的卡牌:', card.value, card.suit);
}

// 切换屏幕
function showScreen(screen) {
    startScreen.classList.remove('active');
    battleScreen.classList.remove('active');
    resultScreen.classList.remove('active');
    screen.classList.add('active');
}

// 开始游戏
function startGame() {
    // 获取玩家选择的难度
    const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
    
    // 重置游戏状态
    gameState = {
        playerHand: [],
        aiHand: [],
        playerDiscard: [],
        aiDiscard: [],
        isPlayerTurn: true,
        gameStarted: false,
        difficulty: selectedDifficulty
    };
    
    // 初始化游戏
    initGame();
    
    // 初始化日志系统
    initMinecraftLogSystem();
    
    // 切换到战斗界面
    showScreen(battleScreen);
}

// 重新开始游戏
function restartGame() {
    showScreen(startScreen);
}

// 事件监听
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);

// 页面加载完成后初始化
window.addEventListener('load', function() {
    // 确保初始界面正确显示
    showScreen(startScreen);
});