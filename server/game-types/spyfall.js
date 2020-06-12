class SpyfallService {
  constructor () {
    var stateChain = [];

    var addCheckpoint = (animate, pause) => stateChain.push({ game: game.toObject(), animate, pause })

    this.getLobbySettings = () =>
      ({ type: 'spyfall', title: 'Spyfall', minPlayers: 4, maxPlayers: 12, players: [] })

    this.initializeGame = (game) => {
      game.settings = game.settings || {};
      const locationCount = Math.max(game.settings.locationCount || 25, locations.length);
      const spyCount = game.settings.spyCount || 1;
      const time = game.setttings.time || 60;
      locations = _shuffle(locations).slice(0, locationCount);

      var location = locations[Math.floor(Math.random() * locationCount)];

      var roles = _.shuffle(location.roles);

      _.shuffle(game.players).forEach((p, i) => {
        spy = i < spyCount;
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
      });

      game.state = {
        public: {
          locations: locations.map(l => ({ id: l.id, name: l.name })),
          spyCount,
          timerFrom: new Date(),
          remainingTime: time,
          paused: false,
        },
        internal: {
          locationId: location.id
        }
      };
    }

    this.onPlayerQuit = (game) => {
      game.finished = true;
      addCheckpoint(false);
      return stateChain;
    }

    this.validateAction = (currentPlayer, game, type, data, onError) => {
      var pause = () => {
        var timerFrom = new Date();
        var remainingTime = game.remainingTime - timerFrom + game.timerFrom;
        game.state.public = {
          ...game.state.public,
          paused: true,
          timerFrom,
          remainingTime,
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

      switch (type) {
        case "nominate":
          if (game.state.public.paused) {
            onError("Timer is already paused, you must wait before you can nominate a player");
            return;
          }

          if (!currentPlayer.state.public.canNominate) {
            onError("You have already nominated a player this round");
            return;
          }

          var targetPlayer = game.players.find(p.userId == data);

          if (!targetPlayer) {
            onError("Target player not found");
          }

          pause();
          game.state.public.nominatedPlayer = data;

          currentPlayer.state.public.vote = true;
          targetPlayer.state.public.accusers.push(currentPlayer.userId);

          break;
        case "vote":
          if (!game.state.public.paused || !game.state.public.nominatedPlayer) {
            onError("There is no vote in progress");
            return;
          }

          if (currentPlayer.state.public.vote !== null) {
            onError("You have already cast your vote");
            return;
          }

          currentPlayer.state.public.vote = data;

          if (game.players.every(p => p.state.public.vote !== null)) {
            if (game.players.filter(p => !p.state.public.vote).length <= game.state.public.spyCount) {
              var targetPlayer = game.players.find(p => p.userId == game.state.public.nominatedPlayer)
              if (targetPlayer.state.private.spy) {

              }
            }
            else {
              game.players.forEach(p => p.state.public.vote = null);

              if (game.state.public.remainingTime <= 0) {
                var index = game.players.findIndex(p => p.userId == game.state.public.nominatedPlayer);

                if (index == game.players.length - 1) {
                  // Round over spies win
                }
                else {
                  game.state.public.nominatedPlayer = game.players[index + 1].userId;
                }
              }
              else {
                unpause();
              }
            }
          }
          break;
        case "guessLocation":
          if (!currentPlayer.state.private.spy) {
            onError("You are not a spy so cannot guess the location");
            return;
          }

          if (game.state.public.nominatedPlayer) {
            onError("There is a vote in progress, you must wait before you can guess the location");
            return;
          }

          if (currentPlayer.state.public.locationGuess) {
            onError("You have already guessed the location this round");
            return;
          }

          currentPlayer.state.public.spy = true;
          currentPlayer.state.public.locationGuess = data;

          if (!game.state.public.paused) {
            pause();
          }

          if (spyCount == 1) {
            var spies = [currentPlayer];
          }
          else {
            var spies = game.players.filter(p => p.state.private.spy);
          }

          if (spies.every(p => p.state.public.locationGuess)) {
            game.state.public.locationId = game.state.internal.locationId;
          }

          break;
        default:
          throw 'Invalid action';
      }
      return stateChain;
    }
  }

}

module.exports = SpyfallService;

const locations = [
  { id: 1, name: 'Airplane', roles: ['First Class Passenger', 'Air Marshall', 'Mechanic', 'Economy Class Passenger', 'Stewardess', 'Co-Pilot', 'Captain', 'Stewardess', 'Economy Class Passenger', 'Child'] },
  { id: 2, name: 'Bank', roles: ['Armored Car Driver', 'Manager', 'Consultant', 'Customer', 'Robber', 'Security Guard', 'Teller', 'Customer', 'Teller', 'Customer'] },
  { id: 3, name: 'Beach', roles: ['Swimmer', 'Kite Surfer', 'Lifeguard', 'Thief', 'Beach Goer', 'Beach Photographer', 'Ice Cream Truck Driver', 'Child', 'Sunbather', 'Beach Goer'] },
  { id: 4, name: 'Theater', roles: ['Coat Check Lady', 'Prompter', 'Cashier', 'Visitor', 'Director', 'Actor', 'Crewman', 'Actor', 'Light Technician', 'Makeup Artist '] },
  { id: 5, name: 'Casino', roles: ['Bartender', 'Head Security Guard', 'Bouncer', 'Manager', 'Hustler', 'Dealer', 'Gambler', 'Waiter', 'Chip Cachier', 'Dealer'] },
  { id: 6, name: 'Cathedral', roles: ['Priest', 'Beggar', 'Sinner', 'Parishioner', 'Tourist', 'Sponsor', 'Choir Singer', 'Tourist', 'Worshipper', 'Cleaner'] },
  { id: 7, name: 'Circus Tent', roles: ['Acrobat', 'Animal Trainer', 'Magician', 'Visitor', 'Fire Eater', 'Clown', 'Juggler', 'Strong Man', 'Visiter', 'Ring Leader'] },
  { id: 8, name: 'Corporate Party', roles: ['Entertainer', 'Manager', 'Unwelcomed Guest', 'Owner', 'Secretary', 'Accountant', 'Delivery Boy', 'Bartender', 'Employee', 'Partner'] },
  { id: 9, name: 'Crusader Army', roles: ['Monk', 'Imprisoned Arab', 'Servant', 'Bishop', 'Squire', 'Archer', 'Knight', 'Knight', 'Knight', 'Servant'] },
  { id: 10, name: 'Day Spa', roles: ['Customer', 'Stylist', 'Masseuse', 'Manicurist', 'Makeup Artist', 'Dermatologist', 'Beautician', 'Customer', 'Customer', 'Masseuse'] },
  { id: 11, name: 'Embassy', roles: ['Security Guard', 'Secretary', 'Ambassador', 'Government Official', 'Tourist', 'Refugee', 'Diplomat', 'Security Guard', 'Diplomat', 'Tourist'] },
  { id: 12, name: 'Hospital', roles: ['Nurse', 'Doctor', 'Anesthesiologist', 'Intern', 'Patient', 'Therapist', 'Surgeon', 'Patient', 'Visitor', 'Nurse'] },
  { id: 13, name: 'Hotel', roles: ['Doorman', 'Security Guard', 'Manager', 'Housekeeper', 'Customer', 'Bartender', 'Bellman', 'Customer', 'Receptionist', 'Maintenance Man'] },
  { id: 14, name: 'Military Base', roles: ['Deserter', 'Colonel', 'Medic', 'Soldier', 'Sniper', 'Officer', 'Tank Engineer', 'Soldier', 'Cook', 'Recruit'] },
  { id: 15, name: 'Movie Studio', roles: ['Stuntman', 'Sound Engineer', 'Cameraman', 'Director', 'Costume Artist', 'Actor', 'Producer', 'Makeup Artist', 'Actor', 'Actors Assistant'] },
  { id: 16, name: 'Ocean Liner', roles: ['Rich Passenger', 'Cook', 'Captain', 'Bartender', 'Musician', 'Waiter', 'Mechanic', 'Entertainer', 'Passenger', 'Cleaner'] },
  { id: 17, name: 'Passenger Train', roles: ['Mechanic', 'Border Patrol', 'Train Attendant', 'Passenger', 'Restaurant Chef', 'Engineer', 'Stoker', 'Passenger', 'Ticket Inspector', 'Driver'] },
  { id: 18, name: 'Pirate Ship', roles: ['Cook', 'Sailor', 'Slave', 'Cannoneer', 'Bound Prisoner', 'Cabin Boy', 'Brave Captain', 'Sailor', 'First Mate', 'Navigator'] },
  { id: 19, name: 'Polar Station', roles: ['Medic', 'Geologist', 'Expedition Leader', 'Biologist', 'Radioman', 'Hydrologist', 'Meteorologist', 'Researcher', 'Geologist', 'Explorer'] },
  { id: 20, name: 'Police Station', roles: ['Detective', 'Lawyer', 'Journalist', 'Criminalist', 'Archivist', 'Patrol Officer', 'Criminal', 'Criminal', 'Witness', 'Cheif'] },
  { id: 21, name: 'Restaurant', roles: ['Musician', 'Customer', 'Bouncer', 'Hostess', 'Head Chef', 'Food Critic', 'Waiter', 'Chef', 'Waiter', 'Customer'] },
  { id: 22, name: 'School', roles: ['Gym Teacher', 'Student', 'Principal', 'Security Guard', 'Janitor', 'Lunch Lady', 'Maintenance Man', 'Student', 'Music Teacher', 'Maths Teacher'] },
  { id: 23, name: 'Service Station', roles: ['Manager', 'Tire Specialist', 'Biker', 'Car Owner', 'Car Wash Operator', 'Electrician', 'Auto Mechanic', 'Reciptionist', 'Car Owner', 'Intern'] },
  { id: 24, name: 'Space Station', roles: ['Engineer', 'Alien', 'Space Tourist', 'Pilot', 'Commander', 'Scientist', 'Doctor', 'Scientist', 'Engineer', 'Space Tourist'] },
  { id: 25, name: 'Submarine', roles: ['Cook', 'Commander', 'Sonar Technician', 'Electronics Technician', 'Sailor', 'Radioman', 'Navigator', 'Sailor', 'Engineer', 'Engineer'] },
  { id: 26, name: 'Supermarket', roles: ['Customer', 'Cashier', 'Butcher', 'Janitor', 'Security Guard', 'Food Sample Demonstrator', 'Shelf Stocker', 'Bulk Buyer', 'Elderly Customer', 'Cashier'] },
  { id: 27, name: 'University', roles: ['Graduate Student', 'Professor', 'Dean', 'Psychologist', 'Maintenance Man', 'Student', 'Janitor', 'Lecturer', 'Student', 'Visitor'] },
  { id: 28, name: 'Amusement Park', roles: ['Ride Operator', 'Parent', 'Food Vendor', 'Cashier', 'Happy Child', 'Annoying Child', 'Teenager', 'Janitor', 'Security Guard', 'Parent'] },
  { id: 29, name: 'Art Gallery', roles: ['Ticket Seller', 'Student', 'Visitor', 'Teacher', 'Security Guard', 'Painter', 'Art Collector', 'Art Critic', 'Photographer', 'Tourist'] },
  { id: 30, name: 'Candy Factory', roles: ['Madcap Redhead', 'Pastry Chef', 'Visitor', 'Taster', 'Truffle Maker', 'Taster', 'Supply Worker', 'Oompa Loompa', 'Inspector', 'Machine Operator'] },
  { id: 31, name: 'Cat Convention', roles: ['Judge', 'Cat-Handler', 'Veterinarian', 'Security Guard', 'Cat Trainer', 'Crazy Cat Lady', 'Animal Lover', 'Cat Owner', 'Cat', 'Cat'] },
  { id: 32, name: 'Cemetery', roles: ['Priest', 'Gothic Girl', 'Grave Robber', 'Poet', 'Mourning Person', 'Gatekeeper', 'Dead Person', 'Relative', 'Flower Seller', 'Grave Digger'] },
  { id: 33, name: 'Coal Mine', roles: ['Safety Inspector', 'Miner', 'Overseer', 'Dump Truck Operator', 'Driller', 'Coordinator', 'Blasting Engineer', 'Miner', 'Solid Waste Engineer', 'Worker'] },
  { id: 34, name: 'Construction Site', roles: ['Free-Roaming Toddler', 'Contractor', 'Crane Driver', 'Trespasser', 'Safety Officer', 'Electrician', 'Engineer', 'Architect', 'Construction Worker', 'Construction Worker'] },
  { id: 35, name: 'Gaming Convention', roles: ['Blogger', 'Cosplayer', 'Gamer', 'Exhibitor', 'Collector', 'Child', 'Security Guard', 'Geek', 'Shy Person', 'Famous Person'] },
  { id: 36, name: 'Gas Station', roles: ['Car Enthusiast', 'Service Attendant', 'Shopkeeper', 'Customer', 'Car Washer', 'Cashier', 'Customer', 'Climate Change Activist', 'Service Attendant', 'Manager'] },
  { id: 37, name: 'Harbor Docks', roles: ['Loader', 'Salty Old Pirate', 'Captain', 'Sailor', 'Loader', 'Fisherman', 'Exporter', 'Cargo Overseer', 'Cargo Inspector', 'Smuggler'] },
  { id: 38, name: 'Ice Hockey Stadium', roles: ['Hockey Fan', 'Medic', 'Hockey Player', 'Food Vendor', 'Security Guard', 'Goaltender', 'Coach', 'Referee', 'Spectator', 'Hockey Player'] },
  { id: 39, name: 'Jail', roles: ['Wrongly Accused Man', 'CCTV Operator', 'Guard', 'Visitor', 'Lawyer', 'Janitor', 'Jailkeeper', 'Criminal', 'Correctional Officer', 'Maniac'] },
  { id: 40, name: 'Jazz Club', roles: ['Bouncer', 'Drummer', 'Pianist', 'Saxophonist', 'Singer', 'Jazz Fanatic', 'Dancer', 'Barman', 'VIP', 'Waiter'] },
  { id: 41, name: 'Library', roles: ['Old Man', 'Journalist', 'Author', 'Volunteer', 'Know-It-All', 'Student', 'Librarian', 'Loudmouth', 'Book Fanatic', 'Nerd'] },
  { id: 42, name: 'Night Club', roles: ['Regular', 'Bartender', 'Security Guard', 'Dancer', 'Pick-Up Artist', 'Party Girl', 'Model', 'Muscly Guy', 'Drunk Person', 'Shy Person'] },
  { id: 43, name: 'Race Track', roles: ['Team Owner', 'Driver', 'Engineer', 'Spectator', 'Referee', 'Mechanic', 'Food Vendor', 'Commentator', 'Bookmaker', 'Spectator'] },
  { id: 44, name: 'Retirement Home', roles: ['Relative', 'Cribbage Player', 'Old Person', 'Nurse', 'Janitor', 'Cook', 'Blind Person', 'Psychologist', 'Old Person', 'Nurse'] },
  { id: 45, name: 'Rock Concert', roles: ['Dancer', 'Singer', 'Fan', 'Guitarist', 'Drummer', 'Roadie', 'Stage Diver', 'Security Guard', 'Bassist', 'Technical Support'] },
  { id: 46, name: 'Sightseeing Bus', roles: ['Old Man', 'Lone Tourist', 'Driver', 'Annoying Child', 'Tourist', 'Tour Guide', 'Photographer', 'Tourist', 'Lost Person', 'Tourist'] },
  { id: 47, name: 'Stadium', roles: ['Medic', 'Hammer Thrower', 'Athlete', 'Commentator', 'Spectator', 'Security Guard', 'Referee', 'Food Vendor', 'High Jumper', 'Sprinter'] },
  { id: 48, name: 'Metro', roles: ['Tourist', 'Operator', 'Ticket Inspector', 'Pregnant Lady', 'Pickpocket', 'Cleaner', 'Businessman', 'Ticket Seller', 'Old Lady', 'Blind Man'] },
  { id: 49, name: 'The U.N.', roles: ['Diplomat', 'Interpreter', 'Blowhard', 'Tourist', 'Napping Delegate', 'Journalist', 'Secretary of State', 'Speaker', 'Secretary-General', 'Lobbyist'] },
  { id: 50, name: 'Vineyard', roles: ['Gardener', 'Gourmet Guide', 'Winemaker', 'Exporter', 'Butler', 'Wine Taster', 'Sommelier', 'Rich Lord', 'Vineyard Manager', 'Enologist'] },
  { id: 51, name: 'Wedding', roles: ['Ring Bearer', 'Groom', 'Bride', 'Officiant', 'Photographer', 'Flower Girl', 'Father of the Bride', 'Wedding Crasher', 'Best Man', 'Relative'] },
  { id: 52, name: 'Zoo', roles: ['Zookeeper', 'Visitor', 'Photographer', 'Child', 'Veterinarian', 'Tourist', 'Food Vendor', 'Cashier', 'Zookeeper', 'Researcher'] },
  { id: 53, name: 'Warehouse', roles: ['Supplier', 'Rat-catcher', 'Package Handler', 'Manager', 'Hygiene Inspector', 'Forklift Truck Driver', 'Customer', 'Delivery Driver', 'Shelf Stocker', 'Customer'] },
  { id: 54, name: 'Terrorist Base', roles: ['Western Spy', 'Suicide Bomber', 'Sniper', 'Pilot', 'Explosives Expert', 'Decrypter', 'Engineer', 'Prisoner', 'Suicide Bomber', 'Prisoner'] },
  { id: 55, name: 'Mascarde Ball', roles: ['Waiter', 'Security Guard', 'Photographer', 'Reporter', 'Organizer', 'Masked Man', 'Dancer', 'Musician', 'Waiter', 'Celebrity'] },
]