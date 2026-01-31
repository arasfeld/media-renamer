import { AppShell, Burger, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export function Home() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <div>Logo</div>
      </AppShell.Header>

      <AppShell.Navbar p="md">Navbar</AppShell.Navbar>

      <AppShell.Main>
        <Title order={1}>💖 Hello World!</Title>
        <Text>Welcome to your Electron application.</Text>
      </AppShell.Main>
    </AppShell>
  );
}
