import { Button } from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter,CardHeader,CardTitle,} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SignInButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { Github, Mail } from "lucide-react";
import { redirect } from "next/navigation";
import React from "react";

const SignInPage = async () => {
  const user = await currentUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-lightBg px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Ingresar
          </CardTitle>
          <CardDescription className="text-center">
            Escoje tu metodo de ingreso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Custom buttons for social sign-in */}
          <div className="space-y-2">
            <SignInButton mode="modal">
              <Button
                variant="outline"
                className="w-full hover:bg-lightBg hoverEffect cursor-pointer"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Ingresar con Google
              </Button>
            </SignInButton>

          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O 
              </span>
            </div>
          </div>

          <SignInButton mode="modal">
            <Button
              variant="outline"
              className="w-full hover:bg-lightBg hoverEffect cursor-pointer"
            >
              <Mail className="mr-2 h-4 w-4" />
              Ingresa tu correo
            </Button>
          </SignInButton>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            No&apos;tienes cuenta ?{" "}
            <SignInButton mode="modal">
              <button className="underline hover:text-darkBlue hoverEffect cursor-pointer font-semibold decoration-[1px] underline-offset-2">
                Crear Cuenta
              </button>
            </SignInButton>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignInPage;
