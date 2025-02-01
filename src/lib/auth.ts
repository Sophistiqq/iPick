// This contains the authentication logic for the application, such as login and register for fetch

type User = {
  id: string;
  email: string;
}

async function login(email: string, password: string): Promise<User | null> {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    return response.json();
  } else {
    return null;
  }
}


type RegisterType = {
  username: string;
  fullname: string;
  mobile_number: string;
  email: string;
  password: string;
}

async function register(data: RegisterType): Promise<User | null> {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    return response.json();
  } else {
    return null;
  }
}

export { login, register };
