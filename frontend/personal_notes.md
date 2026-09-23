Notes for my site
Home / Work / Writing


~/ gerardo-martinez — index
Gerardo Martinez
Applied Data. Marketing Science. Python. AI on the Edge.
Data Scientist with expertise in Marketing Mix Models, campaign optimization, and full-funnel marketing analytics. Outside work, I chase alternative datasets like football, theme parks, prediction markets and trend analysis in platforms like Youtube, TikTok and Reddit. Real-world events are the messiest, most interesting modeling problems there are.

01
ABOUT
Most data scientists hand their models off at the door. I started on the other side of that door.
Before the Python, the MMM models and the statistics, I was thinking in campaigns, briefs, creatives, channel strategy. 
Then a master's degree pulled me toward the science, and I realized I had something most people don't: I could see marketing the way a data scientist does, and data the way a marketer does.   
For eight years, six of them embedded inside marketing teams, I've used that lens to optimize spend across channels, connect what the numbers say to what teams actually do, and drag insights all the way from "huh, interesting" to "let's ship it." 
The model isn't the work. Getting it used is the work.

Queue Scope
↗



https://lacancha.gerrdomarr.com 
- Frontend: Github > Personal Mac Laptop > Azure Containers
    - Framework: Astro
- Backend: Github > Azure VM
    - Database: Azure Postgres
    - Database 2: Pocketbase
        - Pocketable is also hosted in the Azure VM
    - API: Football-API


https://trending.gerardomarr.com 
- Frontend: Github > Personal Mac Laptop > Azure Static Web Apps
- Backend: Fastapi server
    - Server: https://youtubetrending.gerardomarr.com
        - The server lives in the Azure VM 

https://depelicula.gerardomarr.com 
A live wait-time dashboard for Universal Orlando. A cron collector polls themeparks.wiki every minute into SQLite; a FastAPI app then charts how ride queues move across the day, week, and month — with weather overlaid on the trend.
Python
FastAPI
SQLite
pandas
Chart.js


https://moviedashboard.gerardomarr.com/
A dashboard tracking which movies are being screened in Mexico. 
Python
FastAPI
SQLite
pandas
Chart.js
