// ゲーム開始ボタンを押したらタイトル画面を非表示にして、ゲーム画面を表示
document.getElementById("startBtn").addEventListener("click", () => {
    document.getElementById("titleScreen").style.display = "none";
    document.getElementById("gameContainer").style.display = "block";
    initGame(); // ゲーム初期化して開始
  });
  
  // ===== ゲーム用変数定義 =====
  let playerHp, enemyHp, enemyLevel;
  let maxHp = 100;
  let barPos = 0;         // バーの現在位置（%）
  let direction = 1;      // バーの進行方向（1 or -1）
  let animation;          // requestAnimationFrameのID
  let isMoving = true;    // バーが動いてるかどうか
  let isWaiting = false;  // 判定中に連打されないよう制御
  let speed = 3.0;        // バーのスピード（敵レベルで加速）
  
  // ===== DOM要素の取得 =====
  const bar = document.getElementById("bar");
  const stopBtn = document.getElementById("stopBtn");
  const retryBtn = document.getElementById("retryBtn");
  const logEl = document.getElementById("log");
  const enemyImg = document.getElementById("enemyImage");
  
  const criticalZone = document.getElementById("targetCritical");
  const normalZone = document.getElementById("targetNormal");
  const damageText = document.getElementById("damageText");
  const hitEffect = document.getElementById("hitEffect");
  
  // ===== ゲーム初期化関数 =====
  function initGame() {
    playerHp = 100;
    enemyHp = 150;         // 通常攻撃5回で倒せるHP
    enemyLevel = 1;
    speed = 3.0;
    isMoving = true;
    isWaiting = false;
    stopBtn.disabled = false;
    retryBtn.style.display = "none";
  
    // 判定ゾーンを初期化（中央付近）
    setZones(45, 8, 20); // 左端位置, クリティカル幅, 通常幅
    updateEnemyImage();   // 敵画像の初期表示
    updateStatus();       // HPゲージなどを更新
    moveBar();            // バーを動かし始める
    logEl.textContent = "👾 敵が現れた！";
  }
  
  // ===== HPゲージの表示更新 =====
  function updateStatus() {
    document.getElementById("enemyLevel").textContent = enemyLevel;
    document.getElementById("playerHpBar").style.width = `${(playerHp / maxHp) * 100}%`;
    document.getElementById("enemyHpBar").style.width = `${(enemyHp / maxHp) * 100}%`;
  }
  
  // ===== バーを左右に移動させる処理 =====
  function moveBar() {
    if (!isMoving) return;
    barPos += direction * speed;
    if (barPos >= 95 || barPos <= 0) direction *= -1;
    bar.style.left = `${barPos}%`;
    animation = requestAnimationFrame(moveBar);
  }
  
  // ===== 判定ゾーンの位置と幅を設定 =====
  function setZones(baseLeft, criticalWidth, normalWidth) {
    criticalZone.style.left = `${baseLeft + (normalWidth - criticalWidth) / 2}%`;
    criticalZone.style.width = `${criticalWidth}%`;
    normalZone.style.left = `${baseLeft}%`;
    normalZone.style.width = `${normalWidth}%`;
  }
  
  // ===== 敵の画像をレベルに応じて変更する =====
  function updateEnemyImage() {
    const images = {
      1: "images/karma.png",
      2: "images/shiki.png",
      3: "images/ruin.png",
      4: "images/lunaris.png",
      5: "images/dice_boss.png"
    };
  
    enemyImg.src = images[enemyLevel] || "images/karma.png";
  
    // 雷背景（ラスボスだけ）
    const body = document.body;
    if (enemyLevel === 5) {
      body.classList.add("boss-background");
    } else {
      body.classList.remove("boss-background");
    }
  }
  // ===== 敵を倒した時の処理 =====
  function nextEnemy() {
    enemyLevel++;
    if (enemyLevel > 5) {
        if (enemyLevel > 5) {
            logEl.textContent = "🎉 全ての敵を倒した！";
            stopBtn.disabled = true;
            retryBtn.style.display = "none";
          
            // ゲームを非表示 → ED表示
            document.getElementById("gameContainer").style.display = "none";
            document.getElementById("endingScreen").style.display = "flex";
            document.body.classList.remove("boss-background");
          
            return;
          }
    } else {
      enemyHp = 90;
      speed += 1.5; // レベルが上がるごとにバーが速くなる
  
      // 有効ゾーンを狭く＆ランダムにずらす
      const criticalW = 10 - (enemyLevel - 1) * 1.5;
      const normalW = 30 - (enemyLevel - 1) * 2;
      const baseLeft = Math.floor(Math.random() * (80 - normalW));
      setZones(baseLeft, criticalW, normalW);
  
      updateEnemyImage();
      updateStatus();
      logEl.textContent = `👾 敵 ${enemyLevel} が現れた！`;
  
      setTimeout(() => {
        isMoving = true;
        moveBar();
      }, 600);
    }
  }
  
  // ===== ダメージ時に敵を少しバウンドさせる =====
  function damageEffect() {
    enemyImg.style.transform = "scale(1.1)";
    setTimeout(() => {
      enemyImg.style.transform = "scale(1)";
    }, 200);
  }
  
  // ===== ダメージ数値の演出表示 =====
  function showDamageText(text) {
    damageText.textContent = text;
    damageText.style.opacity = "1";
    damageText.style.transform = "translate(-50%, -70%) scale(1.3)";
    setTimeout(() => {
      damageText.style.opacity = "0";
      damageText.style.transform = "translate(-50%, -50%) scale(1)";
    }, 800);
  }
  
  // ===== ミス時の赤い画面点滅演出 =====
  function showMissEffect() {
    hitEffect.style.opacity = "0.4";
    setTimeout(() => {
      hitEffect.style.opacity = "0";
    }, 300);
  }
  
  // ===== 攻撃処理（クリティカル or 通常） =====
  function attack(damage, type) {
    enemyHp -= damage;
    damageEffect();
    showDamageText(type === "critical" ? `CRITICAL! -${damage}` : `-${damage}`);
  
    const enemyDmg = Math.floor(Math.random() * 10 + 1); // 敵の反撃
    playerHp -= enemyDmg;
  
    if (playerHp <= 0) {
      playerHp = 0;
      updateStatus();
      logEl.textContent = "💀 ゲームオーバー...";
      stopBtn.disabled = true;
      retryBtn.style.display = "inline-block";
      return;
    }
  
    if (enemyHp <= 0) {
      logEl.textContent = "敵を倒した！";
      updateStatus();
      nextEnemy();
    } else {
      logEl.textContent = `${type === "critical" ? "💥 クリティカル！" : "🗡 通常攻撃"} 敵から${enemyDmg}反撃`;
      updateStatus();
      setTimeout(() => {
        isMoving = true;
        moveBar();
      }, 500);
    }
  }
  
  // ===== 「タイミングを止める」ボタン処理 =====
  stopBtn.addEventListener("click", () => {
    if (isWaiting || !isMoving) return;
    cancelAnimationFrame(animation);
    isMoving = false;
    isWaiting = true;
    stopBtn.disabled = true;
  
    // 判定：バーの中心がどのゾーンか
    const barCenter = barPos + 2.5;
    const critLeft = parseFloat(criticalZone.style.left);
    const critWidth = parseFloat(criticalZone.style.width);
    const normLeft = parseFloat(normalZone.style.left);
    const normWidth = parseFloat(normalZone.style.width);
  
    let type = "miss";
    if (barCenter >= critLeft && barCenter <= critLeft + critWidth) {
      type = "critical";
    } else if (barCenter >= normLeft && barCenter <= normLeft + normWidth) {
      type = "normal";
    }
  
    // 判定後の処理
    setTimeout(() => {
      if (type === "miss") {
        const enemyDmg = Math.floor(Math.random() * 10 + 1);
        playerHp -= enemyDmg;
        showMissEffect();
        if (playerHp <= 0) {
          playerHp = 0;
          logEl.textContent = `❌ 外した…敵から${enemyDmg}ダメージ💀`;
          updateStatus();
          retryBtn.style.display = "inline-block";
          return;
        } else {
          logEl.textContent = `❌ 外した！敵から${enemyDmg}ダメージ`;
          updateStatus();
          isMoving = true;
          moveBar();
          stopBtn.disabled = false;
          isWaiting = false;
          return;
        }
      }
  
      const damage = type === "critical" ? enemyHp : 30;
      attack(damage, type);
      stopBtn.disabled = false;
      isWaiting = false;
    }, 300);
  });
  
  // ===== 再戦ボタンでゲームを再スタート =====
  retryBtn.addEventListener("click", () => {
    initGame();
  });