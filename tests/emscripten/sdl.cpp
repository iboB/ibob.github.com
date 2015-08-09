#include <SDL2/SDL.h>
#include <GL/gl.h>
#include <emscripten.h>

SDL_Window* win;
SDL_GLContext gl;

void fin()
{
    emscripten_cancel_main_loop();
    SDL_GL_DeleteContext(gl);
    SDL_DestroyWindow(win);
    SDL_Quit();
}

void loop()
{
    //////////////////////////////////////////
    SDL_Event event;
    while (SDL_PollEvent(&event))
    {
        if (event.type == SDL_QUIT)
        {
            fin();
        }
        else if (event.type == SDL_KEYUP)
        {
            switch (event.key.keysym.sym)
            {
            case SDLK_ESCAPE:
                fin();
                break;
            }
        }
    }
    //////////////////////////////////////////

    glClear(GL_COLOR_BUFFER_BIT);

    SDL_GL_SwapWindow(win);
}

int main(int argc, char* argv[])
{
    SDL_Init(SDL_INIT_VIDEO | SDL_INIT_EVENTS);
    win = SDL_CreateWindow("SDL Test",
        SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, 800, 600,
        SDL_WINDOW_OPENGL);

    gl = SDL_GL_CreateContext(win);

    glClearColor(0.0f, 0.1f, 0.4f, 1);

    emscripten_set_main_loop(loop, 0, 1);

    return 0;
}