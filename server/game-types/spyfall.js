const _ = require('lodash');

class Spyfall {
  constructor(game) {
    var stateChain = [];

    var addCheckpoint = (animate, pause) => stateChain.push({ game: game.toObject(), animate, pause })
    var maskUser = (user) => ({ userId: user.userId, displayName: user.displayName });
    this.getLobbySettings = () =>
      ({ type: 'spyfall', title: 'Spyfall', minPlayers: 4, maxPlayers: 12 })

    this.initializeGame = () => {
      game.settings = game.settings || {};
      const locationCount = Math.min(game.settings.locationCount || 25, locations.length);
      const spyCount = game.settings.spyCount || Math.ceil(game.players.length / 8);
      const time = game.settings.time || 60000 * (Math.ceil(game.players.length / 2) + 4);
      var gameLocations = _.shuffle(locations).slice(0, locationCount);

      var location = gameLocations[Math.floor(Math.random() * gameLocations.length)];

      var roles = _.shuffle(location.roles);

      game.state = {
        public: {
          locations: Object.fromEntries(gameLocations.map(a => [a.id, a.name])),
          spyCount,
          timerFrom: new Date(),
          timerLength: time,
          totalTime: time,
          paused: false,
          nominatedPlayer: null
        },
        internal: {
          locationId: location.id,
          spies: []
        }
      };

      _.shuffle(game.players).forEach((p, i) => {
        var spy = i < spyCount;
        p.state.public = {
          accusers: [],
          canNominate: true,
          vote: null
        };
        p.state.private = {
          spy,
          locationId: spy ? null : location.id,
          role: spy ? null : roles[i - spyCount]
        };

        if (spy) {
          game.state.internal.spies.push(p.userId);
        }
      });
    }

    this.onPlayerQuit = () => {
      game.finished = true;
      game.state.public.nominatedPlayer = null;
      addCheckpoint(false);
      return stateChain;
    }

    this.validateAction = (currentPlayer, action, data) => {
      var pause = () => {
        var timerFrom = new Date();
        var timerLength = Math.max(0, game.state.public.timerLength - (timerFrom - game.state.public.timerFrom));
        game.state.public = {
          ...game.state.public,
          paused: true,
          timerFrom,
          timerLength,
        }
      }

      var unpause = () => {
        var timerFrom = new Date();
        game.state.public = {
          ...game.state.public,
          paused: false,
          timerFrom,
        }
      }

      switch (action) {
        case "nominate":
          if (game.state.public.paused) {
            throw { name: "ActionError", message:"Timer is already paused, you must wait before you can nominate a player"};
          }

          if (!currentPlayer.state.public.canNominate) {
            throw { name: "ActionError", message:"You have already nominated a player this round"};
          }

          if (data == currentPlayer.userId) {
            throw { name: "ActionError", message:"You cannot nominate yourself"};
          }

          var targetPlayer = game.players.find(p => p.userId == data);

          if (!targetPlayer) {
            throw { name: "ActionError", message:"Target player not found"};
          }

          pause();
          game.state.public.nominatedPlayer = maskUser(targetPlayer);

          currentPlayer.state.public.vote = true;
          targetPlayer.state.public.vote = false;
          currentPlayer.state.public.canNominate = false;
          targetPlayer.state.public.accusers.push(maskUser(currentPlayer));
          addCheckpoint(false);
          break;
        case "vote":
          if (!game.state.public.paused || !game.state.public.nominatedPlayer) {
            if (game.state.public.timerLength - (new Date() - game.state.public.timerFrom) <= 0) {
              pause();
              game.state.public.nominatedPlayer = maskUser(game.players[0]);
              game.players[0].state.public.vote = false;
            }
            else {
              throw { name: "ActionError", message:"There is no vote in progress"};
            }
          }

          if (currentPlayer.state.public.vote !== null) {
            throw { name: "ActionError", message:"You have already cast your vote"};
          }

          currentPlayer.state.public.vote = data;

          if (game.players.every(p => p.state.public.vote !== null)) {
            if (game.players.filter(p => !p.state.public.vote).length <= game.state.public.spyCount) {
              game.players.forEach(p => p.state.public.spy = p.state.private.spy);

              addCheckpoint(true, 1000);

              game.finished = true;
            }
            else {

              if (game.state.public.timerLength <= 0) {
                var index = game.players.findIndex(p => p.userId == game.state.public.nominatedPlayer.userId);

                if (index == game.players.length - 1) {
                  game.players.forEach(p => p.state.public.spy = p.state.private.spy)
                  addCheckpoint(true, 1000);

                  game.state.public.nominatedPlayer = null;
                  game.finished = true;
                }
                else {
                  addCheckpoint(false, 1000);
                  game.players.forEach(p => p.state.public.vote = null);
                  game.state.public.nominatedPlayer = maskUser(game.players[index + 1]);
                  game.players[index + 1].state.public.vote = false;
                }
              }
              else {
                game.players.forEach(p => p.state.public.vote = null);
                game.state.public.nominatedPlayer = null;
                unpause();
              }
            }
          }
          addCheckpoint(false);
          break;
        case "guessLocation":
          if (!currentPlayer.state.private.spy) {
            throw { name: "ActionError", message:"You are not a spy so cannot guess the location"};
          }

          if (game.state.public.nominatedPlayer) {
            throw { name: "ActionError", message:"There is a vote in progress, you must wait before you can guess the location"};
          }

          if (currentPlayer.state.public.locationGuess) {
            throw { name: "ActionError", message:"You have already guessed the location this round"};
          }
          if (!game.state.public.paused) {
            pause();
          }

          if (game.state.public.timerLength <= 0) {
            throw { name: "ActionError", message:"You cannot guess the location after the timer has run out"};
          }

          currentPlayer.state.public.spy = true;
          currentPlayer.state.public.locationGuess = data;

          if (game.players.every(p => !p.state.private.spy || p.state.public.locationGuess)) {
            game.state.public.locationId = game.state.internal.locationId;
            addCheckpoint(true, 1000);
            game.finished = true;
          }

          addCheckpoint(false);

          break;
        default:
          throw { name: "ActionError", message:"Invalid action"};
      }
      return stateChain;
    }
  }

}

module.exports = Spyfall;

const locations = [
  { id: '1', name: 'Airplane', roles: ['First Class Passenger', 'Air Marshall', 'Mechanic', 'Economy Class Passenger', 'Stewardess', 'Co-Pilot', 'Captain', 'Stewardess', 'Economy Class Passenger', 'Child'] },
  { id: '2', name: 'Bank', roles: ['Armored Car Driver', 'Manager', 'Consultant', 'Customer', 'Robber', 'Security Guard', 'Teller', 'Customer', 'Teller', 'Customer'] },
  { id: '3', name: 'Beach', roles: ['Swimmer', 'Kite Surfer', 'Lifeguard', 'Thief', 'Beach Goer', 'Beach Photographer', 'Ice Cream Truck Driver', 'Child', 'Sunbather', 'Beach Goer'] },
  { id: '4', name: 'Theater', roles: ['Coat Check Lady', 'Prompter', 'Cashier', 'Visitor', 'Director', 'Actor', 'Crewman', 'Actor', 'Light Technician', 'Makeup Artist '] },
  { id: '5', name: 'Casino', roles: ['Bartender', 'Head Security Guard', 'Bouncer', 'Manager', 'Hustler', 'Dealer', 'Gambler', 'Waiter', 'Chip Cachier', 'Dealer'] },
  { id: '6', name: 'Cathedral', roles: ['Priest', 'Beggar', 'Sinner', 'Parishioner', 'Tourist', 'Sponsor', 'Choir Singer', 'Tourist', 'Worshipper', 'Cleaner'] },
  { id: '7', name: 'Circus Tent', roles: ['Acrobat', 'Animal Trainer', 'Magician', 'Visitor', 'Fire Eater', 'Clown', 'Juggler', 'Strong Man', 'Visiter', 'Ring Leader'] },
  { id: '8', name: 'Corporate Party', roles: ['Entertainer', 'Manager', 'Unwelcomed Guest', 'Owner', 'Secretary', 'Accountant', 'Delivery Boy', 'Bartender', 'Employee', 'Partner'] },
  { id: '9', name: 'Crusader Army', roles: ['Monk', 'Imprisoned Arab', 'Servant', 'Bishop', 'Squire', 'Archer', 'Knight', 'Knight', 'Knight', 'Servant'] },
  { id: '10', name: 'Day Spa', roles: ['Customer', 'Stylist', 'Masseuse', 'Manicurist', 'Makeup Artist', 'Dermatologist', 'Beautician', 'Customer', 'Customer', 'Masseuse'] },
  { id: '11', name: 'Embassy', roles: ['Security Guard', 'Secretary', 'Ambassador', 'Government Official', 'Tourist', 'Refugee', 'Diplomat', 'Security Guard', 'Diplomat', 'Tourist'] },
  { id: '12', name: 'Hospital', roles: ['Nurse', 'Doctor', 'Anesthesiologist', 'Intern', 'Patient', 'Therapist', 'Surgeon', 'Patient', 'Visitor', 'Nurse'] },
  { id: '13', name: 'Hotel', roles: ['Doorman', 'Security Guard', 'Manager', 'Housekeeper', 'Customer', 'Bartender', 'Bellman', 'Customer', 'Receptionist', 'Maintenance Man'] },
  { id: '14', name: 'Military Base', roles: ['Deserter', 'Colonel', 'Medic', 'Soldier', 'Sniper', 'Officer', 'Tank Engineer', 'Soldier', 'Cook', 'Recruit'] },
  { id: '15', name: 'Movie Studio', roles: ['Stuntman', 'Sound Engineer', 'Cameraman', 'Director', 'Costume Artist', 'Actor', 'Producer', 'Makeup Artist', 'Actor', 'Actors Assistant'] },
  { id: '16', name: 'Ocean Liner', roles: ['Rich Passenger', 'Cook', 'Captain', 'Bartender', 'Musician', 'Waiter', 'Mechanic', 'Entertainer', 'Passenger', 'Cleaner'] },
  { id: '17', name: 'Passenger Train', roles: ['Mechanic', 'Border Patrol', 'Train Attendant', 'Passenger', 'Restaurant Chef', 'Engineer', 'Stoker', 'Passenger', 'Ticket Inspector', 'Driver'] },
  { id: '18', name: 'Pirate Ship', roles: ['Cook', 'Sailor', 'Slave', 'Cannoneer', 'Bound Prisoner', 'Cabin Boy', 'Brave Captain', 'Sailor', 'First Mate', 'Navigator'] },
  { id: '19', name: 'Polar Station', roles: ['Medic', 'Geologist', 'Expedition Leader', 'Biologist', 'Radioman', 'Hydrologist', 'Meteorologist', 'Researcher', 'Geologist', 'Explorer'] },
  { id: '20', name: 'Police Station', roles: ['Detective', 'Lawyer', 'Journalist', 'Criminalist', 'Archivist', 'Patrol Officer', 'Criminal', 'Criminal', 'Witness', 'Cheif'] },
  { id: '21', name: 'Restaurant', roles: ['Musician', 'Customer', 'Bouncer', 'Hostess', 'Head Chef', 'Food Critic', 'Waiter', 'Chef', 'Waiter', 'Customer'] },
  { id: '22', name: 'School', roles: ['Gym Teacher', 'Student', 'Principal', 'Security Guard', 'Janitor', 'Lunch Lady', 'Maintenance Man', 'Student', 'Music Teacher', 'Maths Teacher'] },
  { id: '23', name: 'Service Station', roles: ['Manager', 'Tire Specialist', 'Biker', 'Car Owner', 'Car Wash Operator', 'Electrician', 'Auto Mechanic', 'Reciptionist', 'Car Owner', 'Intern'] },
  { id: '24', name: 'Space Station', roles: ['Engineer', 'Alien', 'Space Tourist', 'Pilot', 'Commander', 'Scientist', 'Doctor', 'Scientist', 'Engineer', 'Space Tourist'] },
  { id: '25', name: 'Submarine', roles: ['Cook', 'Commander', 'Sonar Technician', 'Electronics Technician', 'Sailor', 'Radioman', 'Navigator', 'Sailor', 'Engineer', 'Engineer'] },
  { id: '26', name: 'Supermarket', roles: ['Customer', 'Cashier', 'Butcher', 'Janitor', 'Security Guard', 'Food Sample Demonstrator', 'Shelf Stocker', 'Bulk Buyer', 'Elderly Customer', 'Cashier'] },
  { id: '27', name: 'University', roles: ['Graduate Student', 'Professor', 'Dean', 'Psychologist', 'Maintenance Man', 'Student', 'Janitor', 'Lecturer', 'Student', 'Visitor'] },
  { id: '28', name: 'Amusement Park', roles: ['Ride Operator', 'Parent', 'Food Vendor', 'Cashier', 'Happy Child', 'Annoying Child', 'Teenager', 'Janitor', 'Security Guard', 'Parent'] },
  { id: '29', name: 'Art Gallery', roles: ['Ticket Seller', 'Student', 'Visitor', 'Teacher', 'Security Guard', 'Painter', 'Art Collector', 'Art Critic', 'Photographer', 'Tourist'] },
  { id: '30', name: 'Candy Factory', roles: ['Madcap Redhead', 'Pastry Chef', 'Visitor', 'Taster', 'Truffle Maker', 'Taster', 'Supply Worker', 'Oompa Loompa', 'Inspector', 'Machine Operator'] },
  { id: '31', name: 'Cat Convention', roles: ['Judge', 'Cat-Handler', 'Veterinarian', 'Security Guard', 'Cat Trainer', 'Crazy Cat Lady', 'Animal Lover', 'Cat Owner', 'Cat', 'Cat'] },
  { id: '32', name: 'Cemetery', roles: ['Priest', 'Gothic Girl', 'Grave Robber', 'Poet', 'Mourning Person', 'Gatekeeper', 'Dead Person', 'Relative', 'Flower Seller', 'Grave Digger'] },
  { id: '33', name: 'Coal Mine', roles: ['Safety Inspector', 'Miner', 'Overseer', 'Dump Truck Operator', 'Driller', 'Coordinator', 'Blasting Engineer', 'Miner', 'Solid Waste Engineer', 'Worker'] },
  { id: '34', name: 'Construction Site', roles: ['Free-Roaming Toddler', 'Contractor', 'Crane Driver', 'Trespasser', 'Safety Officer', 'Electrician', 'Engineer', 'Architect', 'Construction Worker', 'Construction Worker'] },
  { id: '35', name: 'Gaming Convention', roles: ['Blogger', 'Cosplayer', 'Gamer', 'Exhibitor', 'Collector', 'Child', 'Security Guard', 'Geek', 'Shy Person', 'Famous Person'] },
  { id: '36', name: 'Gas Station', roles: ['Car Enthusiast', 'Service Attendant', 'Shopkeeper', 'Customer', 'Car Washer', 'Cashier', 'Customer', 'Climate Change Activist', 'Service Attendant', 'Manager'] },
  { id: '37', name: 'Harbor Docks', roles: ['Loader', 'Salty Old Pirate', 'Captain', 'Sailor', 'Loader', 'Fisherman', 'Exporter', 'Cargo Overseer', 'Cargo Inspector', 'Smuggler'] },
  { id: '38', name: 'Ice Hockey Stadium', roles: ['Hockey Fan', 'Medic', 'Hockey Player', 'Food Vendor', 'Security Guard', 'Goaltender', 'Coach', 'Referee', 'Spectator', 'Hockey Player'] },
  { id: '39', name: 'Jail', roles: ['Wrongly Accused Man', 'CCTV Operator', 'Guard', 'Visitor', 'Lawyer', 'Janitor', 'Jailkeeper', 'Criminal', 'Correctional Officer', 'Maniac'] },
  { id: '40', name: 'Jazz Club', roles: ['Bouncer', 'Drummer', 'Pianist', 'Saxophonist', 'Singer', 'Jazz Fanatic', 'Dancer', 'Barman', 'VIP', 'Waiter'] },
  { id: '41', name: 'Library', roles: ['Old Man', 'Journalist', 'Author', 'Volunteer', 'Know-It-All', 'Student', 'Librarian', 'Loudmouth', 'Book Fanatic', 'Nerd'] },
  { id: '42', name: 'Night Club', roles: ['Regular', 'Bartender', 'Security Guard', 'Dancer', 'Pick-Up Artist', 'Party Girl', 'Model', 'Muscly Guy', 'Drunk Person', 'Shy Person'] },
  { id: '43', name: 'Race Track', roles: ['Team Owner', 'Driver', 'Engineer', 'Spectator', 'Referee', 'Mechanic', 'Food Vendor', 'Commentator', 'Bookmaker', 'Spectator'] },
  { id: '44', name: 'Retirement Home', roles: ['Relative', 'Cribbage Player', 'Old Person', 'Nurse', 'Janitor', 'Cook', 'Blind Person', 'Psychologist', 'Old Person', 'Nurse'] },
  { id: '45', name: 'Rock Concert', roles: ['Dancer', 'Singer', 'Fan', 'Guitarist', 'Drummer', 'Roadie', 'Stage Diver', 'Security Guard', 'Bassist', 'Technical Support'] },
  { id: '46', name: 'Sightseeing Bus', roles: ['Old Man', 'Lone Tourist', 'Driver', 'Annoying Child', 'Tourist', 'Tour Guide', 'Photographer', 'Tourist', 'Lost Person', 'Tourist'] },
  { id: '47', name: 'Stadium', roles: ['Medic', 'Hammer Thrower', 'Athlete', 'Commentator', 'Spectator', 'Security Guard', 'Referee', 'Food Vendor', 'High Jumper', 'Sprinter'] },
  { id: '48', name: 'Metro', roles: ['Tourist', 'Operator', 'Ticket Inspector', 'Pregnant Lady', 'Pickpocket', 'Cleaner', 'Businessman', 'Ticket Seller', 'Old Lady', 'Blind Man'] },
  { id: '49', name: 'The U.N.', roles: ['Diplomat', 'Interpreter', 'Blowhard', 'Tourist', 'Napping Delegate', 'Journalist', 'Secretary of State', 'Speaker', 'Secretary-General', 'Lobbyist'] },
  { id: '50', name: 'Vineyard', roles: ['Gardener', 'Gourmet Guide', 'Winemaker', 'Exporter', 'Butler', 'Wine Taster', 'Sommelier', 'Rich Lord', 'Vineyard Manager', 'Enologist'] },
  { id: '51', name: 'Wedding', roles: ['Ring Bearer', 'Groom', 'Bride', 'Officiant', 'Photographer', 'Flower Girl', 'Father of the Bride', 'Wedding Crasher', 'Best Man', 'Relative'] },
  { id: '52', name: 'Zoo', roles: ['Zookeeper', 'Visitor', 'Photographer', 'Child', 'Veterinarian', 'Tourist', 'Food Vendor', 'Cashier', 'Zookeeper', 'Researcher'] },
  { id: '53', name: 'Warehouse', roles: ['Supplier', 'Rat-catcher', 'Package Handler', 'Manager', 'Hygiene Inspector', 'Forklift Truck Driver', 'Customer', 'Delivery Driver', 'Shelf Stocker', 'Customer'] },
  { id: '54', name: 'Terrorist Base', roles: ['Western Spy', 'Suicide Bomber', 'Sniper', 'Pilot', 'Explosives Expert', 'Decrypter', 'Engineer', 'Prisoner', 'Suicide Bomber', 'Prisoner'] },
  { id: '55', name: 'Mascarde Ball', roles: ['Waiter', 'Security Guard', 'Photographer', 'Reporter', 'Organizer', 'Masked Man', 'Dancer', 'Musician', 'Waiter', 'Celebrity'] },
]