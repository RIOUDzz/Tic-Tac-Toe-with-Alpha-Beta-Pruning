import math

# Constants for players
AI = 'X'
HUMAN = 'O'

def check_winner(board):
    """
    Returns 'X', 'O', 'Draw' or None (game continues)
    Board is a list of 9 elements.
    """
    win_combinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], # Horizontal
        [0, 3, 6], [1, 4, 7], [2, 5, 8], # Vertical
        [0, 4, 8], [2, 4, 6]             # Diagonal
    ]
    
    for combo in win_combinations:
        if board[combo[0]] == board[combo[1]] == board[combo[2]] != '':
            return board[combo[0]]
            
    if '' not in board:
        return 'Draw'
        
    return None

def minimax(board, depth, is_maximizing, alpha, beta, max_depth=None):
    """
    Minimax algorithm with Alpha-Beta pruning and optional depth limiting.
    """
    winner = check_winner(board)
    if winner == AI:
        return 10 - depth
    if winner == HUMAN:
        return depth - 10
    if winner == 'Draw':
        return 0
    
    # Depth limiting for "Medium" mode
    if max_depth is not None and depth >= max_depth:
        return 0 # Heuristic approach: return neutral if depth limit reached
        
    if is_maximizing:
        best_score = -math.inf
        for i in range(9):
            if board[i] == '':
                board[i] = AI
                score = minimax(board, depth + 1, False, alpha, beta, max_depth)
                board[i] = ''
                best_score = max(score, best_score)
                alpha = max(alpha, best_score)
                if beta <= alpha:
                    break
        return best_score
    else:
        best_score = math.inf
        for i in range(9):
            if board[i] == '':
                board[i] = HUMAN
                score = minimax(board, depth + 1, True, alpha, beta, max_depth)
                board[i] = ''
                best_score = min(score, best_score)
                beta = min(beta, best_score)
                if beta <= alpha:
                    break
        return best_score

import random

def get_best_move(board, difficulty='impossible'):
    """
    Calculates the best move for the AI.
    """
    empty_cells = [i for i, val in enumerate(board) if val == '']
    
    if difficulty == 'easy':
        # 80% chance to make a random move
        if random.random() < 0.8:
            return random.choice(empty_cells)
    
    # Medium Mode: Limit depth to 2 moves ahead
    max_depth = 2 if difficulty == 'medium' else None
            
    best_score = -math.inf
    move = -1
    
    for i in empty_cells:
        board[i] = AI
        score = minimax(board, 0, False, -math.inf, math.inf, max_depth)
        board[i] = ''
        if score > best_score:
            best_score = score
            move = i
                
    return move
