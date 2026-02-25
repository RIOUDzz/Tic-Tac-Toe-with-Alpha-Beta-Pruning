from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import os

from logic import get_best_move, check_winner
from database import init_db, get_scores, update_score

app = FastAPI()

# Initialize Database on startup
init_db()

# Board state model
class BoardState(BaseModel):
    board: List[str] # List of 9 strings ('X', 'O', or '')
    difficulty: str = "impossible" # easy or impossible

class GameResult(BaseModel):
    winner: str # 'X', 'O', or 'Draw'

# Serve static files from the 'static' directory
# Ensure 'static' directory exists
static_path = os.path.join(os.getcwd(), "static")
if not os.path.exists(static_path):
    os.makedirs(static_path)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_index():
    return FileResponse("static/index.html")

@app.get("/scores")
async def fetch_scores():
    return get_scores()

@app.post("/record-result")
async def record_result(result: GameResult):
    update_score(result.winner)
    return {"status": "success"}

@app.post("/move")
async def ai_move(state: BoardState):

    board = state.board
    difficulty = state.difficulty
    
    if len(board) != 9:
        raise HTTPException(status_code=400, detail="Board must be a list of 9 elements.")
    
    # Check if game is already over
    winner = check_winner(board)
    if winner:
        return {"move": None, "winner": winner}
        
    # Get AI move
    move = get_best_move(board, difficulty)

    
    # Preview the win if AI makes this move
    temp_board = list(board)
    temp_board[move] = 'X'
    new_winner = check_winner(temp_board)
    
    return {"move": move, "winner": new_winner}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
