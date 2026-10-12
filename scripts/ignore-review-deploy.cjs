// Netlify: exit 0 skips the build; exit 1 allows it.
const branches = ['feature/futstats-2-thesportsdb','feature/futstats-3-image-ocr'];
const review = [process.env.BRANCH, process.env.HEAD].some(branch=>branches.includes(branch));
process.exit(review ? 0 : 1);
