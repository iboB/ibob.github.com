import ruby

let characterClass = rubyGlobal("Character")
var c = characterClass.new("Bozo")

type Weapon = ref object
  name: string
  damage, durability: int

c.equip(Weapon(name: "Holy Sword of Ultimate Imbalance",
               damage: 99999999,
               durability: 666666666))

c.attack("Kiro")
