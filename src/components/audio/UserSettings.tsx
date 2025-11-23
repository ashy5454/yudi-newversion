// import { useUI, useUser } from '@/lib/audio/state';
// import Modal from './Modal';

// export default function UserSettings() {
//   const { name, info, setName, setInfo } = useUser();
//   const { setShowUserConfig } = useUI();

//   function updateClient() {
//     setShowUserConfig(false);
//   }

//   return (
//     <Modal onClose={() => setShowUserConfig(false)}>
//       <div className="max-w-md mx-auto p-6 space-y-6 bg-card text-card-foreground rounded-lg">
//         <p className="text-muted-foreground leading-relaxed">
//           This is a simple tool that allows you to design, test, and banter with
//           custom AI characters on the fly.
//         </p>

//         <form
//           onSubmit={e => {
//             e.preventDefault();
//             setShowUserConfig(false);
//             updateClient();
//           }}
//           className="space-y-4"
//         >
//           <p className="text-sm text-muted-foreground">Adding this optional info makes the experience more fun:</p>

//           <div className="space-y-2">
//             <p className="text-sm font-medium text-foreground">Your name</p>
//             <input
//               type="text"
//               name="name"
//               value={name}
//               onChange={e => setName(e.target.value)}
//               placeholder="What do you like to be called?"
//               className="w-full px-3 py-2 border border-border rounded-md bg-input text-input-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
//             />
//           </div>

//           <div className="space-y-2">
//             <p className="text-sm font-medium text-foreground">Your info</p>
//             <textarea
//               rows={3}
//               name="info"
//               value={info}
//               onChange={e => setInfo(e.target.value)}
//               placeholder="Things we should know about you… Likes, dislikes, hobbies, interests, favorite movies, books, tv shows, foods, etc."
//               className="w-full px-3 py-2 border border-border rounded-md bg-input text-input-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
//             />
//           </div>

//           <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors">
//             Let's go!
//           </button>
//         </form>
//       </div>
//     </Modal>
//   );
// }
