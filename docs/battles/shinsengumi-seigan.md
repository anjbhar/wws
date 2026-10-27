# Seigan-no-Kamae and Three Stage Thrust

Seigan is exclusive to the Shinsengumi swordsman. At the opening and whenever he reconsiders his stance (20% of turns), Seigan has a 70% selection weight and each other form has 6%. Choosing his current form lets him attack; switching forms spends the turn. This makes Seigan his usual stance while keeping Chudan, Jodan, Gedan, Kasumi and Waki available throughout the fight. It uses Chudan's combat modifiers and the transparent `Shinsengumi-Seigan-v1.png` sprite with its own body targets and alignment.

While in Seigan, if his Quick Cut or Heavy Cut is parried, Three Stage Thrust follows immediately after the parry animation, before the next fighter acts. The original cut counts as strike one. Strike two targets the torso with normal parry and dodge chances. A dodge ends the chain. If strike two hits or is parried, strike three immediately targets the torso and can only be dodged, using the defender's usual Quick Cut torso dodge chance; parry is disabled. Strike three always ends the chain.

Both follow-ups deal normal Quick Cut torso damage and apply the usual wound/practice-impact rules. They skip the normal attack wind-up and use eight-frame feedback motion for quick succession. The original Heavy Cut still incurs its normal recovery; follow-ups add no attack recovery cost and consume no extra turns. Practice protection still stops the player at 1 HP.

After his first completed Three Stage Thrust chain each battle, he pauses to explain: “It's called Three Stage Thrust. When you parry my blade, I can strike twice more in an instant.” The speech waits for the full chain to finish and preserves the pending turns, round and stance.

Dodging or taking the first cut does not trigger Three Stage Thrust. Other fighters and stances cannot use it. At half health, dialogue pauses the duel once without changing his current stance or abilities. His single-sword forms remain available for the whole fight. The old two-sword sprite remains in the project as an unused asset.

Validation: `node tools/check-lightless-blade.cjs`, plus the opening-form, duel, feedback, Shinsengumi sparring and sprite-size checks.
