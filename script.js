
        class SimonGame {
            constructor() {
                this.gameSequence = [];
                this.userSequence = [];
                this.level = 0;
                this.isPlaying = false;
                this.isShowingSequence = false;
                this.bestScore = localStorage.getItem('simonBestScore') || 0;
                this.speed = 1;
                this.soundEnabled = true;
                
                this.colors = ['pink', 'blue', 'orange', 'light-blue'];
                this.sounds = this.createSounds();
                
                this.elements = {
                    startBtn: document.getElementById('startBtn'),
                    gameStatus: document.getElementById('gameStatus'),
                    levelDisplay: document.getElementById('levelDisplay'),
                    bestScore: document.getElementById('bestScore'),
                    speedDisplay: document.getElementById('speedDisplay'),
                    progressBar: document.getElementById('progressBar'),
                    soundToggle: document.getElementById('soundToggle'),
                    celebration: document.getElementById('celebration')
                };
                
                this.initializeGame();
            }

            createSounds() {
                // Create audio context for sounds
                const sounds = {};
                this.colors.forEach((color, index) => {
                    sounds[color] = {
                        frequency: [262, 330, 392, 523][index], // C, E, G, C (next octave)
                        play: () => this.playTone(sounds[color].frequency, 0.3)
                    };
                });
                return sounds;
            }

            playTone(frequency, duration) {
                if (!this.soundEnabled) return;
                
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    
                    oscillator.frequency.value = frequency;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
                    
                    oscillator.start(audioCtx.currentTime);
                    oscillator.stop(audioCtx.currentTime + duration);
                } catch (e) {
                    console.log('Audio not supported');
                }
            }

            initializeGame() {
                this.updateDisplay();
                this.bindEvents();
            }

            bindEvents() {
                this.elements.startBtn.addEventListener('click', () => this.startGame());
                this.elements.soundToggle.addEventListener('click', () => this.toggleSound());
                
                this.colors.forEach(color => {
                    const btn = document.getElementById(color);
                    btn.addEventListener('click', () => this.handleColorClick(color));
                });
            }

            toggleSound() {
                this.soundEnabled = !this.soundEnabled;
                this.elements.soundToggle.textContent = this.soundEnabled ? '🔊' : '🔇';
            }

            startGame() {
                this.gameSequence = [];
                this.userSequence = [];
                this.level = 0;
                this.isPlaying = true;
                this.speed = 1;
                
                this.elements.startBtn.disabled = true;
                this.elements.startBtn.textContent = 'PLAYING...';
                this.elements.gameStatus.textContent = 'Watch the sequence!';
                
                this.nextRound();
            }

            nextRound() {
                this.level++;
                this.userSequence = [];
                
                // Increase speed every 3 levels
                if (this.level > 1 && this.level % 3 === 0) {
                    this.speed += 0.2;
                }
                
                // Add new color to sequence
                const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
                this.gameSequence.push(randomColor);
                
                this.updateDisplay();
                this.showSequence();
            }

            async showSequence() {
                this.isShowingSequence = true;
                this.disableButtons();
                
                this.elements.gameStatus.textContent = `Level ${this.level} - Watch carefully!`;
                
                // Show sequence numbers
                this.gameSequence.forEach((color, index) => {
                    const seqDisplay = document.getElementById(`seq-${color}`);
                    seqDisplay.textContent = index + 1;
                    seqDisplay.classList.add('show');
                });
                
                // Wait a bit before starting sequence
                await this.delay(800 / this.speed);
                
                for (let i = 0; i < this.gameSequence.length; i++) {
                    const color = this.gameSequence[i];
                    await this.flashButton(color);
                    await this.delay(200 / this.speed);
                }
                
                // Hide sequence numbers
                this.colors.forEach(color => {
                    const seqDisplay = document.getElementById(`seq-${color}`);
                    seqDisplay.classList.remove('show');
                });
                
                this.isShowingSequence = false;
                this.enableButtons();
                this.elements.gameStatus.textContent = 'Your turn! Repeat the sequence';
                this.updateProgressBar(0);
            }

            async flashButton(color) {
                const button = document.getElementById(color);
                button.classList.add('flash');
                this.sounds[color].play();
                
                await this.delay(400 / this.speed);
                button.classList.remove('flash');
            }

            handleColorClick(color) {
                if (!this.isPlaying || this.isShowingSequence) return;
                
                this.sounds[color].play();
                this.flashButton(color);
                this.userSequence.push(color);
                
                const currentIndex = this.userSequence.length - 1;
                
                // Update progress bar
                this.updateProgressBar((this.userSequence.length / this.gameSequence.length) * 100);
                
                if (this.userSequence[currentIndex] !== this.gameSequence[currentIndex]) {
                    this.gameOver();
                    return;
                }
                
                if (this.userSequence.length === this.gameSequence.length) {
                    this.roundComplete();
                }
            }

            roundComplete() {
                this.elements.gameStatus.textContent = 'Excellent! Get ready for next level...';
                
                // Celebration for higher levels
                if (this.level >= 5) {
                    this.showCelebration();
                }
                
                setTimeout(() => {
                    this.nextRound();
                }, 1500 / this.speed);
            }

            gameOver() {
                this.isPlaying = false;
                this.disableButtons();
                
                const container = document.querySelector('.game-container');
                container.classList.add('game-over');
                
                this.elements.gameStatus.innerHTML = `
                    Game Over!<br>
                    <small>Final Score: Level ${this.level}</small>
                `;
                
                // Update best score
                if (this.level > this.bestScore) {
                    this.bestScore = this.level;
                    localStorage.setItem('simonBestScore', this.bestScore);
                    this.elements.gameStatus.innerHTML += '<br><small>🎉 New Best Score! 🎉</small>';
                    this.showCelebration();
                }
                
                // Flash all buttons red
                this.colors.forEach(color => {
                    const btn = document.getElementById(color);
                    btn.style.filter = 'hue-rotate(0deg) saturate(2) brightness(0.8)';
                });
                
                setTimeout(() => {
                    container.classList.remove('game-over');
                    this.colors.forEach(color => {
                        const btn = document.getElementById(color);
                        btn.style.filter = '';
                    });
                    this.resetGame();
                }, 2000);
            }

            resetGame() {
                this.isPlaying = false;
                this.level = 0;
                this.speed = 1;
                this.gameSequence = [];
                this.userSequence = [];
                
                this.elements.startBtn.disabled = false;
                this.elements.startBtn.textContent = 'START GAME';
                this.elements.gameStatus.textContent = 'Ready to play again?';
                
                this.updateDisplay();
                this.enableButtons();
            }

            showCelebration() {
                for (let i = 0; i < 50; i++) {
                    setTimeout(() => {
                        const confetti = document.createElement('div');
                        confetti.className = 'confetti';
                        confetti.style.left = Math.random() * 100 + '%';
                        confetti.style.background = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][Math.floor(Math.random() * 4)];
                        confetti.style.animationDelay = Math.random() * 0.3 + 's';
                        this.elements.celebration.appendChild(confetti);
                        
                        setTimeout(() => confetti.remove(), 2000);
                    }, i * 30);
                }
            }

            disableButtons() {
                this.colors.forEach(color => {
                    document.getElementById(color).classList.add('disabled');
                });
            }

            enableButtons() {
                this.colors.forEach(color => {
                    document.getElementById(color).classList.remove('disabled');
                });
            }

            updateDisplay() {
                this.elements.levelDisplay.textContent = this.level;
                this.elements.bestScore.textContent = this.bestScore;
                this.elements.speedDisplay.textContent = this.speed.toFixed(1) + 'x';
            }

            updateProgressBar(percentage) {
                this.elements.progressBar.style.width = percentage + '%';
            }

            delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
        }

        // Initialize the game when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            new SimonGame();
        });
   