import Brand from "./Brand";
import SearchCommand from "./SearchCommand";
export default function Header() {
  return (
    <header className="topbar">
      <Brand />
      <SearchCommand shortcut />
    </header>
  );
}
