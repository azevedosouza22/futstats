// Netlify: exit 0 skips the build; exit 1 allows it.
const branch = 'feature/futstats-2-thesportsdb';
const review = [process.env.BRANCH, process.env.HEAD].includes(branch);
process.exit(review ? 0 : 1);
