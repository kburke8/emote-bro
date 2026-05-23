# EmoteBros — Game Design Spec

## 1. Game Summary

**EmoteBros** is a multiplayer lobby game where players collect little characters called **EmoteBros**, place them in their base, earn money over time, buy pets and upgrades, defend their base, and try to steal valuable EmoteBros from other players.

There is no final “win” condition. The goal is to keep getting richer, collecting better EmoteBros, evolving them, buying better pets and mounts, unlocking VIP areas, and protecting your base from other players.

The game is meant to feel like a fun Roblox-style tycoon/collector/stealing game.

---

# 2. Core Game Loop

The basic loop is:

1. Player joins a lobby.
2. Player is assigned one of four bases.
3. EmoteBros spawn on a blue/purple carpet path.
4. Player spends coins to buy EmoteBros.
5. Bought EmoteBros travel to the player’s base.
6. Once inside the base, EmoteBros generate money over time.
7. Player steps on their money slab to collect earned money.
8. Player uses money to buy:

   * More EmoteBros
   * Pets
   * Base defenses
   * Guard suits
   * Lock upgrades
   * Lucky blocks
   * Evolutions
9. Other players can try to steal EmoteBros from bases.
10. Player defends their base using locks, guards, weapons, teleport items, and upgrades.
11. Hourly events, daily spin rewards, VIP zones, and mounts add extra goals.

---

# 3. Players and Lobbies

## Lobby Size

Each lobby has:

* **4 player bases**
* Up to **4 active players**
* Spectators could be allowed later, but not needed for the first version.

## Base Assignment

When a player joins:

* If a base is empty, assign the player to that base.
* Each base has:

  * An entrance
  * A lock slab
  * A money collection slab
  * 12 EmoteBro slots
  * Guard positions
  * A visible owner label
  * Optional pet area
  * Optional VIP upgrades

## Leaving the Game

For the first version:

* Player data should save.
* If a player leaves, their base becomes unavailable for a short time, then resets for a new player.
* Their saved EmoteBros, coins, pets, VIP, mounts, and upgrades are stored.

---

# 4. Map Layout

The map should include:

## Main Spawn Area

Where players appear when they join.

Includes:

* Instructions board
* Daily spin wheel
* Shop
* Pet shop
* Lucky block shop
* Mount shop
* VIP entrance
* Event countdown board

## EmoteBro Carpet Path

A blue/purple carpet path where EmoteBros appear and move.

Important behavior:

* EmoteBros spawn at the start of the carpet.
* They move along the carpet toward the finish.
* Players can buy them while they are moving.
* If an EmoteBro reaches the finish without being bought, it disappears.
* A lever can change which direction the EmoteBros are moving on the carpet.

## Four Bases

Each lobby has four bases around the map.

Each base includes:

* 12 carpet spheres / slots for EmoteBros
* A money collection slab
* A lock slab
* A base entrance
* Guard slots
* Owner-only messages
* A base teleport destination

## Pet Store

Players buy pets here.

Pets increase the amount of money earned.

## VIP Area

Only VIP players can enter.

The VIP area has:

* A special carpet
* Better rewards
* Double-quality stuff
* Better EmoteBros
* Better lucky blocks
* Better items

Everything in the VIP area should be roughly **2x as good** as normal.

---

# 5. EmoteBros

## What Are EmoteBros?

EmoteBros are collectible characters that players buy, place in their base, and use to earn money.

They are the main collectible and money-making system.

## Spawning

EmoteBros spawn on the main carpet.

Each EmoteBro has:

* Name
* Rarity
* Cost
* Money generated per second
* Appearance
* Evolution level
* Special traits, sometimes

Example EmoteBros:

| Name        |   Rarity |           Cost |            Money/sec |
| ----------- | -------: | -------------: | -------------------: |
| Basic Bro   |   Common |       25 coins |                    1 |
| Silly Bro   |   Common |       75 coins |                    3 |
| Cool Bro    | Uncommon |      250 coins |                   10 |
| Mega Bro    |     Rare |    1,000 coins |                   40 |
| Secret Bro  |   Secret |            ??? |            Very high |
| Evolved Bro |  Evolved | Evolution only | Higher than original |

## Buying an EmoteBro

When a player clicks or touches an EmoteBro:

* If they have enough money:

  * Spend the money.
  * The EmoteBro becomes owned by that player.
  * It walks or slides to that player’s base.
  * It takes the next available EmoteBro slot.
* If the player has no space:

  * Show message: “Your base is full!”
* If the player does not have enough money:

  * Show message: “Not enough coins!”

## Base Capacity

Each base has **12 EmoteBro slots**.

If all 12 are full:

* Player cannot buy more EmoteBros unless they:

  * Sell one
  * Evolve/combine some
  * Upgrade storage later, if added
  * Replace one with a better one

For version 1, keep it simple:

* 12 max EmoteBros
* Player can sell/remove an EmoteBro from their base

## Money Generation

Each EmoteBro generates money over time.

Money is not instantly added to the player’s wallet.

Instead:

* Money builds up in the player’s base bank.
* The player must step on the **money slab** to collect it.
* The money slab shows how much is waiting.

Example:

> “Collect: 1,250 coins”

## Evolving EmoteBros

Players can evolve EmoteBros into better EmoteBros.

Possible first version:

* 3 of the same EmoteBro can evolve into 1 stronger version.
* Evolution costs coins or special currency.
* Evolved EmoteBros earn more money.

Example:

| Input        |             Cost | Result          |
| ------------ | ---------------: | --------------- |
| 3 Basic Bros |        100 coins | Super Basic Bro |
| 3 Cool Bros  |      1,000 coins | Mega Cool Bro   |
| 3 Mega Bros  | Special currency | Ultra Mega Bro  |

## Event EmoteBros

Some events announce special EmoteBros.

Examples:

* Secret Egg coming soon
* Mega EmoteBro coming soon
* Ready-to-evolve EmoteBro coming soon

These appear on the carpet during events.

---

# 6. Lucky Blocks

Lucky blocks hatch EmoteBros.

## Lucky Block Types

Initial types:

| Lucky Block        |                   Cost | Reward Quality             |
| ------------------ | ---------------------: | -------------------------- |
| Normal Lucky Block |                    Low | Common to rare             |
| Mega Lucky Block   |                   High | Better chance for rare     |
| Secret Lucky Block | Very high / event only | Chance for secret EmoteBro |
| VIP Lucky Block    |               VIP only | 2x better rewards          |

## Lucky Block Behavior

When a player buys or opens a lucky block:

1. Play opening animation.
2. Roll for an EmoteBro.
3. Show the result.
4. Send the EmoteBro to the player’s base if there is room.
5. If there is no room, either:

   * Put it in temporary storage, or
   * Ask the player to replace an existing EmoteBro.

For the first version, use temporary storage or a simple “replace” menu.

## Example Lucky Block Chances

Normal Lucky Block:

| Rarity   | Chance |
| -------- | -----: |
| Common   |    60% |
| Uncommon |    25% |
| Rare     |    10% |
| Epic     |     4% |
| Secret   |     1% |

Mega Lucky Block:

| Rarity   | Chance |
| -------- | -----: |
| Common   |    30% |
| Uncommon |    30% |
| Rare     |    25% |
| Epic     |    12% |
| Secret   |     3% |

VIP Lucky Block:

Rewards should feel about **2x better** than normal.

---

# 7. Bases

Each player has a base.

## Base Parts

Each base has:

* 12 EmoteBro slots
* Money collection slab
* Lock slab
* Entrance
* Owner label
* Defense item area
* Guard positions

## Money Slab

The money slab collects all money generated by EmoteBros.

Behavior:

* Only the base owner can collect from it.
* When the owner steps on it:

  * Add stored base money to player wallet.
  * Reset stored money to 0.
  * Play coin sound/effect.

## Lock Slab

The lock slab protects the base.

When the owner steps on the lock slab:

* The base locks for **2 minutes**.
* Other players cannot enter.
* A timer appears above the base or near the door.
* When the timer ends, the base unlocks.

## Owner-Only Messages

When the base becomes unlocked:

* Only the owner sees a message:

  * “Your base is unlocked!”

This message is private.

Other players do **not** get a warning.

---

# 8. Stealing System

Players can try to steal EmoteBros from other players’ bases.

## Basic Stealing

A player can steal an EmoteBro if:

* The target base is unlocked
* The player can reach the EmoteBro
* The EmoteBro is not protected by a guard
* The thief is not stunned or blocked

When stealing:

1. Player interacts with an enemy EmoteBro.
2. EmoteBro becomes “carried” or follows the thief.
3. The thief must get it back to their own base.
4. If successful, the EmoteBro is added to the thief’s base.
5. If the thief gets stunned, teleported, or knocked away, the steal can fail.

## Stealing Risk

Stealing should be risky because defenders can use:

* Base locks
* Guards
* Guard bows
* Teleport guards
* Maces
* Knockback items
* Base teleport items
* Lock upgrades

## Suggested Rule

A stolen EmoteBro is not fully stolen until it reaches the thief’s base.

Until then:

* It can be recovered.
* The thief can be stopped.

---

# 9. Base Lock Upgrades

Players can upgrade their base lock.

## Normal Lock

Default behavior:

* Blocks other players from entering for 2 minutes.

## Teleport Lock Upgrade

An upgraded lock looks the same as a normal lock, but has a hidden effect.

If another player touches it:

* They are teleported back to their own base.
* The lock still looks normal, so it is hard to tell if it is upgraded.

This makes the lock a sneaky trap.

## Possible Lock Upgrade Levels

| Level | Effect                            |                     Cost |
| ----: | --------------------------------- | -----------------------: |
|     1 | Locks base for 2 minutes          |             Free/default |
|     2 | Slightly shorter cooldown         |                    Coins |
|     3 | Teleports intruders to their base | Coins + special currency |
|     4 | Longer lock duration              |         Special currency |
|     5 | Hidden trap lock                  |     VIP/special currency |

For version 1, use:

* Normal lock
* Teleport lock

---

# 10. Guard System

Players can buy a **guard suit** from the shop and put it on an EmoteBro.

That EmoteBro becomes a guard.

## Guard Rules

A guard:

* Protects the base
* Has a fixed vision range
* Detects intruders inside that range
* Attacks or uses an item if an intruder gets close
* Does not protect the entire base by itself

## Guard Range

The guard has a fixed range.

For version 1:

* Use a circle around the guard.
* Example range: 15 studs / tiles / units.
* If an enemy enters the range, the guard reacts.

## Guard Types

### Basic Guard

* Detects nearby enemies
* Runs toward them
* Knocks them back
* Stuns them briefly

### Teleport Guard

Some guards can have teleport items.

When they hit an enemy:

* Teleport the enemy to a random place, or
* Teleport the enemy back to their own base

This can depend on the guard item.

### Bow Guard

Some guards can have bows.

Bow guard behavior:

* Attacks from range
* Shoots at intruders
* Stuns the target for **2 seconds**
* Does not need to be right next to the intruder

## Guard Items

| Item            | Effect                                  |
| --------------- | --------------------------------------- |
| Mace            | Knocks enemy away and stuns 4–5 seconds |
| Teleport Wand   | Teleports enemy to random location      |
| Base Teleporter | Teleports enemy to their own base       |
| Bow             | Stuns enemy from range for 2 seconds    |

## Guard Balance

Guards should not be unbeatable.

Limitations:

* Fixed vision range
* Cooldown after attack
* Only protects part of the base
* Can maybe be distracted or avoided
* Strong guards cost more

---

# 11. Player Defense Items

Players can buy items to defend their base while moving around.

## Mace

Used when someone is outside the base waiting for the lock to expire.

Effect:

* Knock target far away
* Stun target for 4–5 seconds
* Cooldown after use

Suggested values:

* Knockback distance: medium
* Stun duration: 4 seconds
* Cooldown: 15 seconds

## Teleport-to-Base Item

Players can buy or earn an item that lets them teleport back to their base.

Useful when:

* Their base is unlocked
* They see the private message
* They need to stop a thief quickly

Behavior:

* Player activates item.
* Player teleports to their base.
* Item has cooldown or limited uses.

Suggested version 1:

* Cooldown: 60 seconds
* Cannot use while stunned

---

# 12. Pets

Pets help players earn more money.

## Buying Pets

Players buy pets from the pet store.

Pets cost coins or special currency.

## Pet Effect

Pets increase income.

Example effects:

| Pet        |             Cost |      Bonus |
| ---------- | ---------------: | ---------: |
| Tiny Pet   |        100 coins |  +5% money |
| Happy Pet  |        500 coins | +10% money |
| Golden Pet |      2,500 coins | +25% money |
| Mega Pet   | Special currency | +50% money |

## Pet Stacking

For the first version:

* Player can equip one pet at a time.
* Better pets give better money bonuses.

Later version:

* Allow multiple pets.
* Add pet levels.
* Add pet rarities.

---

# 13. Mounts

Mounts make players move faster.

Mounts are bought with special game-only currency.

## Mount Rules

* Better mounts cost more currency.
* Faster mounts are more expensive.
* Mounts help players:

  * Get around the map faster
  * Return to base faster
  * Reach EmoteBros faster
  * Escape or chase thieves

## Example Mounts

| Mount      |                   Cost | Speed Bonus |
| ---------- | ---------------------: | ----------: |
| Scooter    |    50 special currency |  +10% speed |
| Hoverboard |   150 special currency |  +20% speed |
| Wolf       |   400 special currency |  +35% speed |
| Dragon     | 1,000 special currency |  +50% speed |
| VIP Dragon |               VIP only |  +60% speed |

---

# 14. Currency System

The game has two main currencies.

## Coins

Coins are the main free currency.

Players earn coins from:

* EmoteBros
* Money slab
* Lucky blocks
* Daily spin
* Events
* Selling EmoteBros

Coins are used for:

* Buying EmoteBros
* Pets
* Guards
* Lock upgrades
* Basic lucky blocks
* Evolutions

## Special Game Currency

The game also has a special currency. Working name: **Emo Bucks**.

Emo Bucks can be used for:

* VIP
* Mounts
* Spins
* Faster events
* Special lucky blocks
* Premium-looking items

The kids said players can get this by spending real money, but for development/testing, we should support it as an in-game currency first.

For a kid-focused game, I’d strongly recommend you build the prototype with **no real-money purchases**. Just make Emo Bucks earnable or give them from admin/dev commands. If this ever became public, real-money purchases would need parent-friendly design and platform compliance.

---

# 15. VIP System

Players can buy VIP using the special game-only currency.

## VIP Benefits

VIP players get:

* Access to VIP area
* Special VIP carpet
* Better EmoteBros
* Better lucky blocks
* Better rewards
* Double-quality stuff

## VIP Area Rule

Only VIP players can enter.

If a non-VIP player tries to enter:

* Show message:

  * “VIP only!”
* Block entrance or teleport them back.

## VIP Reward Rule

Everything in VIP should be approximately **2x as good**.

Examples:

* EmoteBros earn 2x as much
* Lucky blocks have 2x better odds
* Items are stronger or cheaper
* Events may have better rewards

---

# 16. Daily Spin Wheel

The daily spin wheel gives players a reward once per day.

## Basic Behavior

Each player can spin once per day.

Rewards can include:

* Coins
* Emo Bucks
* Lucky blocks
* Pets
* Temporary boosts
* Mount trial
* Guard item
* Faster event token

## Wheel Changes Every Day

The spin wheel changes every day.

That means:

* Reward options are different each day.
* The wheel feels fresh.
* Players want to check back.

## Login Streak Bonus

If a player comes back multiple days in a row:

* Their personal spin wheel gets better.
* This only affects that player.
* Better streak = better possible rewards.

Example streak system:

| Streak | Wheel Quality   |
| -----: | --------------- |
|  1 day | Normal          |
| 2 days | Slightly better |
| 3 days | Better          |
| 5 days | Great           |
| 7 days | Super wheel     |

## Streak Reset

If the player misses a day:

* Streak resets to 1, or
* Drops by 1

For version 1, reset to 1.

---

# 17. Events

Events happen every hour by default.

## Event Timer

The map should have an event board showing:

> “Next Event: 42:15”

When the timer reaches 0, an event starts.

## Event Types

Examples:

### Secret Egg Event

A secret egg appears.

Players can hatch it for a chance at a rare EmoteBro.

### Mega EmoteBro Event

A mega EmoteBro appears on the carpet.

It is valuable and players race to get it.

### Ready-to-Evolve Event

A special EmoteBro appears that is already close to evolving or can evolve immediately.

### Lucky Block Storm

More lucky blocks appear for a short time.

### VIP Event

VIP area gets extra rewards for a few minutes.

## Event Frequency

Default:

* One event every **1 hour**

## Speeding Up Events

Players can spend special currency to make the **next event** happen sooner.

Important rule:

* Spending currency only speeds up the **next event**
* It does not permanently speed up all future events

Example:

* Event happens in 45 minutes.
* Player spends Emo Bucks.
* Timer drops to 10 minutes.
* After that event happens, the next event goes back to 1 hour.

## Hidden Good EmoteBro Twist

When a player speeds up an event, they may get a special EmoteBro that looks bad to everyone else.

Rule:

* To the owner, it may appear suspicious or special.
* To other players, it looks bad, weak, or not worth stealing.
* Once it reaches the owner’s base, it reveals its true form.
* In the owner’s base, it looks how it really should.
* It is actually very, very good.

This is a great “secret treasure” mechanic.

---

# 18. Lever System

There is a lever that changes which way EmoteBros move on the carpet.

## Behavior

When a player pulls the lever:

* The direction of EmoteBro movement changes.
* EmoteBros may start moving along a different path.
* This can affect which players reach them first.
* It may change strategy.

## Cooldown

To avoid chaos:

* Lever should have a cooldown.
* Example: 30 seconds.

## Possible Rule

Only one lever pull every 30 seconds globally.

Message:

> “The EmoteBro path has changed!”

---

# 19. Shops

## Main Shop

Sells:

* Guard suits
* Maces
* Teleport-to-base items
* Lock upgrades
* Evolution items
* Basic boosts

## Pet Shop

Sells:

* Pets
* Better pets
* Maybe pet upgrades later

## Lucky Block Shop

Sells:

* Normal lucky blocks
* Mega lucky blocks
* Event lucky blocks
* VIP lucky blocks, if VIP

## Mount Shop

Sells:

* Mounts using special currency

## VIP Shop

Only accessible to VIP players.

Sells:

* Better versions of normal items
* VIP lucky blocks
* Faster mounts
* Better guards

---

# 20. Game States

## Player State

Each player needs saved data:

```json
{
  "playerId": "string",
  "coins": 0,
  "emoBucks": 0,
  "isVip": false,
  "ownedEmoteBros": [],
  "baseSlots": [],
  "pets": [],
  "equippedPetId": null,
  "mounts": [],
  "equippedMountId": null,
  "lockLevel": 1,
  "guardItems": [],
  "dailySpinLastClaimed": null,
  "dailyStreak": 0
}
```

## EmoteBro Data

```json
{
  "id": "basic_bro",
  "name": "Basic Bro",
  "rarity": "Common",
  "costCoins": 25,
  "moneyPerSecond": 1,
  "evolutionGroup": "basic_bro",
  "evolutionLevel": 1,
  "appearance": "basic_bro_model",
  "canBeGuard": true
}
```

## Base Slot Data

```json
{
  "slotIndex": 0,
  "emoteBroInstanceId": "abc123",
  "isGuard": false,
  "guardItem": null
}
```

## Guard Data

```json
{
  "type": "bow_guard",
  "range": 15,
  "attackCooldownSeconds": 5,
  "stunSeconds": 2,
  "effect": "stun"
}
```

## Event Data

```json
{
  "nextEventAt": "timestamp",
  "currentEvent": null,
  "eventWasSpedUpByPlayerId": null
}
```

---

# 21. MVP Version

This is the first version Claude Code should build.

## MVP Features

Build these first:

1. 4-player lobby
2. 4 bases
3. EmoteBro carpet path
4. EmoteBros spawn and move
5. Players can buy EmoteBros
6. EmoteBros go to player base
7. 12 base slots
8. EmoteBros generate money
9. Money slab collects money
10. Base lock slab locks base for 2 minutes
11. Other players can steal EmoteBros when base is unlocked
12. Mace item knocks/stuns players
13. Pet shop with simple money multiplier
14. Lucky blocks that hatch EmoteBros
15. Basic daily spin
16. Simple hourly event
17. Basic guard suit
18. Bow guard stun
19. Teleport guard
20. Save/load player data

## MVP Can Skip

These can wait until version 2:

* Real-money purchases
* Complex VIP economy
* Lots of mounts
* Advanced animations
* Huge number of EmoteBros
* Complex event varieties
* Trading
* Player inventory UI polish
* Advanced guard AI
* Mobile optimization, unless targeting mobile immediately

---

# 22. Version 2 Features

After the MVP works, add:

* VIP area
* Mount shop
* Event speed-up currency
* Hidden bad-looking-but-good EmoteBro
* Daily spin wheel that changes daily
* Login streak better rewards
* More lucky block types
* More EmoteBro evolutions
* Better guard types
* Lock teleport upgrade
* VIP lucky blocks
* More map polish

---

# 23. Important Balance Rules

The game should feel fun, not unfair.

## Stealing Balance

Stealing should be exciting, but not too easy.

Defender advantages:

* Lock
* Private unlock message
* Teleport-to-base item
* Guards
* Mace
* Teleport lock upgrade

Thief advantages:

* Can wait for lock to expire
* Can sneak around guard range
* Can use speed mount
* Can steal valuable EmoteBros

## Money Balance

Early game should be fast.

Example pacing:

* First EmoteBro within 10 seconds
* First pet within 2–3 minutes
* First lucky block within 5 minutes
* First guard within 10 minutes
* First evolution within 15–20 minutes
* VIP/mount goals later

## Base Capacity Balance

12 slots is good because players have to make choices.

They should ask:

* Do I keep this EmoteBro?
* Do I evolve it?
* Do I replace it?
* Do I make it a guard?
* Do I risk stealing a better one?

---

# 24. UI Requirements

## Main HUD

Show:

* Coins
* Emo Bucks
* Current pet bonus
* Equipped mount
* Base lock timer
* Event timer
* Daily spin available indicator

## Base UI

Show:

* Base owner
* Lock status
* Money waiting on slab
* EmoteBro slots
* Guard status

## Shop UI

Each shop item should show:

* Name
* Cost
* What it does
* Buy button

## Messages

Important messages:

* “Not enough coins!”
* “Your base is full!”
* “Your base is unlocked!”
* “You bought Basic Bro!”
* “Someone is stealing your EmoteBro!”
* “You collected 500 coins!”
* “You got a Rare EmoteBro!”
* “Next event starts soon!”
* “VIP only!”

---

# 25. Suggested Prototype Tech Shape

Since you mentioned Claude Code, I’d structure the project around clean systems rather than trying to hard-code everything.

## Main Systems

* `PlayerSystem`
* `BaseSystem`
* `CurrencySystem`
* `EmoteBroSpawnSystem`
* `EmoteBroMovementSystem`
* `IncomeSystem`
* `StealingSystem`
* `LockSystem`
* `GuardSystem`
* `ShopSystem`
* `PetSystem`
* `LuckyBlockSystem`
* `DailySpinSystem`
* `EventSystem`
* `SaveSystem`

## Data-Driven Config

Put EmoteBros, pets, mounts, lucky blocks, and shop items in config files.

Example:

```json
{
  "emoteBros": [
    {
      "id": "basic_bro",
      "name": "Basic Bro",
      "rarity": "Common",
      "costCoins": 25,
      "moneyPerSecond": 1
    },
    {
      "id": "mega_bro",
      "name": "Mega Bro",
      "rarity": "Rare",
      "costCoins": 1000,
      "moneyPerSecond": 40
    }
  ]
}
```

This makes it easy for the kids to invent new EmoteBros later without changing game logic.

---

# 26. Open Questions for the Kids Later

These do not block the first version, but they would help make the game better:

1. What do EmoteBros look like?
2. Are they emojis, people, monsters, animals, or silly faces?
3. What are the 12 best EmoteBros?
4. What should the rarest EmoteBro be called?
5. Can players sell EmoteBros?
6. Can players trade with each other?
7. What happens if a thief gets caught while carrying an EmoteBro?
8. Can guards be upgraded?
9. Can pets evolve too?
10. What should VIP look like?
11. What should the best mount be?
12. Should the map have secrets?

---

# 27. One-Sentence Pitch

**EmoteBros is a multiplayer collector-tycoon game where players buy funny EmoteBros, earn money from their base, hatch lucky blocks, evolve characters, steal from other bases, and defend their own base with locks, guards, pets, mounts, and surprise events.**
