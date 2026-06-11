export default async function handler(req, res) {
  try {
    const response = await fetch('https://kick.com/api/v1/channels/santulp');
    const data = await response.json();
    const isLive = data?.livestream !== null && data?.livestream !== undefined;
    res.status(200).json({ isLive });
  } catch(err) {
    res.status(200).json({ isLive: false });
  }
}
