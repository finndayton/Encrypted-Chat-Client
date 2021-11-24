import sys
from deck_of_cards import deck_of_cards
from queue import Queue
from queue import LifoQueue
# import set
from collections import OrderedDict

# Play around with random and slightly better than random polices (greedy) which uses heuristics
# slightly better is if a card on discard pile will make a meld, then take it. 
# knock right away if you can....
# prioritize laying down the lowest card versus a random card. 
# improve this by basing it on the status of the game. 
# 3. local search with hooke jeeves in like 5 lines 
# 4.cross entropy method
# 5.look ahead with rollouts
# 6.monte carlo tree search


def play_gin():
    suits = {0:'spades', 1:'hearts', 2:'diamonds', 3:'clubs'}
    deck_obj = deck_of_cards.DeckOfCards()
    
    for _ in range(6): deck_obj.shuffle_deck()

    deck = Queue(maxsize = 52)
    for _ in range(52):
        card = deck_obj.give_random_card() 
        deck.put({'suit': card.suit, 'rank': card.rank}) #make sure face cards are 10, 11, 12
    
    player_one_hand = []
    player_two_hand = []
    for _ in range(10): player_one_hand.append(deck.get())
    for _ in range(10): player_two_hand.append(deck.get())

    #sort the hands
    
    # print(player_one_hand)
    discard_pile = LifoQueue(maxsize=30) #discard_pile.qsize(), stack.put() and stack.get

    
    dummy_hand = [{'suit': 1, 'rank': 10}, 
    {'suit': 3, 'rank': 10}, 
    {'suit': 0, 'rank': 10}, 
    {'suit': 1, 'rank': 10}, 
    {'suit': 1, 'rank': 9}, 
    {'suit': 1, 'rank': 8}, 
    {'suit': 0, 'rank': 12}, 
    {'suit': 0, 'rank': 13}, 
    {'suit': 1, 'rank': 13}, 
    {'suit': 1, 'rank': 4}]

    player_one_vs_player_two(player_one_hand, player_two_hand, deck, discard_pile)
    
    remaining_hand = find_melds(dummy_hand)
    

def player_one_vs_player_two(player_one_hand, player_two_hand, deck, discard_pile):

    return 

#e.g. [{'suit': 'hearts', 'rank': 10}, {'suit': 'hearts', 'rank': 1}, {'suit': 'spades', 'rank': 2}, 
def find_melds(hand):
    #there are possible melds: (4, 4), (3, 3, 4), (3, 3), (3), (4), (4, 3), ()
    #further, for each of these (except empty) there are could be multiple options. 
    #check out https://stackoverflow.com/questions/62707039/gin-rummy-algorithm-for-determining-optimal-melding
    
    melds = []
    # melds = set()
    print(type(melds))
    if len(hand) < 3: return melds 

    hand_copy = hand
    #find a four meld 
    three_meld = find_three_meld(hand_copy)
    if (len(three_meld) > 2): hand_copy = remove(three_meld, hand_copy)
    #find up to two three melds 
    
    four_meld = find_four_meld(hand_copy)
    if (len(four_meld) > 3): hand_copy = remove(four_meld, hand_copy)

    four_meld2 = find_four_meld(hand_copy)
    if (len(four_meld2) > 3): hand_copy = remove(four_meld2, hand_copy)

    return hand_copy
    #four melds 

    
    # melds = unique(melds)
    print("melds = ", melds)
    return melds

def find_three_meld(hand):
    #all three melds 
    for i in range(len(hand)):
        for j in range(i + 1, len(hand)):
            for k in range(j + 1, len(hand)):
                meld = [hand[i], hand[j], hand[k]]
                if is_meld(meld): 
                    return meld
    return []


def find_four_meld(hand):
    for i in range(len(hand)):
        for j in range(i + 1, len(hand)):
            for k in range(j + 1, len(hand)):
                for l in range(k + 1, len(hand)):
                    meld = [hand[i], hand[j], hand[k], hand[l]]
                    if is_meld(meld): 
                        return meld
    return []

def is_meld(cards):
    if len(cards) < 3 or len(cards) > 4: return False
    return is_run(cards) or is_set(cards)

def is_set(cards):
    rank = cards[0]['rank']
    for card in cards:
        if card['rank'] != rank: return False
    return True

def is_run(cards):
    cards = sorted(cards, key=lambda card: card['rank'])
    prev_rank = cards[0]['rank']
    suit = cards[0]['suit']
    for i in range(1, len(cards)):
        # print('cards[i][\'suit\'] = ', cards[i]['suit'], 'suit = ', suit)
        if cards[i]['suit'] != suit or cards[i]['rank'] - 1 != prev_rank: return False
        prev_rank = cards[i]['rank']
    return True

def remove(meld, hand):
    for item in meld:
        hand.remove(item)
    return hand

#flesh out
def conflict(melds, meld1, meld2):
    return True

def unique(melds):
    list(OrderedDict.fromkeys(melds))


def main():
    play_gin()

if __name__ == '__main__':
    main()


