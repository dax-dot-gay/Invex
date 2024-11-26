export type User =
    | {
          type: "User" | "Admin";
          id: string;
          username: string;
      }
    | {
          type: "Ephemeral";
          id: string;
          invite: string;
      };
