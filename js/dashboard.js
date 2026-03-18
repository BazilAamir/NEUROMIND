
        function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
        
        // Background Animation
        const canvas = document.getElementById('neuro-bg');
        const ctx = canvas.getContext('2d');
        let width, height, particles = [];
        function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; initParticles(); }
        function initParticles() {
            particles = []; const count = Math.floor(width / 15);
            for(let i=0; i<count; i++) particles.push({x:Math.random()*width, y:Math.random()*height, vx:(Math.random()-0.5)*0.5, vy:(Math.random()-0.5)*0.5, size:Math.random()*2.5+1});
        }
        function animate() {
            ctx.clearRect(0, 0, width, height); ctx.fillStyle = 'rgba(168, 85, 247, 0.9)'; ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)'; 
            particles.forEach((p, i) => {
                p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>width)p.vx*=-1; if(p.y<0||p.y>height)p.vy*=-1;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                for(let j=i+1; j<particles.length; j++){
                    let p2=particles[j]; if(Math.sqrt((p.x-p2.x)**2+(p.y-p2.y)**2)<120){ ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p2.x,p2.y); ctx.stroke(); }
                }
            });
            requestAnimationFrame(animate);
        }
        window.addEventListener('resize', resize); resize(); animate();

        // Chatbot
        function toggleChat(show) {
            const panel = document.getElementById('chatPanel'); const fab = document.getElementById('fabChat');
            if(show) { panel.classList.add('active'); fab.classList.add('hidden'); } else { panel.classList.remove('active'); fab.classList.remove('hidden'); }
        }
        function sendChatMessage() {
            const input = document.getElementById('chatInput'); const chatBody = document.getElementById('chatBody');
            if(input.value.trim() === "") return;
            const userDiv = document.createElement('div'); userDiv.className = 'msg msg-user'; userDiv.innerText = input.value;
            chatBody.appendChild(userDiv); input.value = ""; chatBody.scrollTop = chatBody.scrollHeight;
            setTimeout(() => {
                const botDiv = document.createElement('div'); botDiv.className = 'msg msg-bot'; botDiv.innerHTML = "I am processing your request...";
                chatBody.appendChild(botDiv); chatBody.scrollTop = chatBody.scrollHeight;
            }, 1000);
        }
        function handleKeyPress(e) { if(e.key === 'Enter') sendChatMessage(); }
    