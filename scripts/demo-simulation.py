#!/usr/bin/env python3
"""
APIClaw Demo Simulation
Creates a convincing terminal demo showing APIClaw in action.
For recording with asciinema.
"""

import sys
import time
import json
import random

# ANSI colors
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
CYAN = "\033[36m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
MAGENTA = "\033[35m"
BLUE = "\033[34m"
WHITE = "\033[97m"
GRAY = "\033[90m"

def type_text(text, delay=0.03, newline=True):
    """Simulate typing with variable speed."""
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        # Vary speed slightly for realism
        time.sleep(delay * random.uniform(0.5, 1.5))
    if newline:
        print()

def instant_print(text, newline=True):
    """Print instantly (for command output)."""
    if newline:
        print(text)
    else:
        sys.stdout.write(text)
        sys.stdout.flush()

def pause(seconds=0.5):
    time.sleep(seconds)

def clear_screen():
    print("\033[2J\033[H", end="")

def show_prompt():
    sys.stdout.write(f"{GREEN}${RESET} ")
    sys.stdout.flush()

def demo():
    clear_screen()
    pause(0.5)
    
    # Scene 1: Show the problem
    instant_print(f"{DIM}# The problem: Manual API integration is slow{RESET}")
    pause(1)
    instant_print(f"{DIM}# Let's fix that with APIClaw{RESET}")
    pause(1.5)
    print()
    
    # Scene 2: Start MCP session
    show_prompt()
    type_text("npx @nordsym/apiclaw", delay=0.04)
    pause(0.5)
    
    instant_print(f"""
{CYAN}╔══════════════════════════════════════════════════════════════╗
║  {BOLD}APIClaw{RESET}{CYAN} v1.0.0 — The API layer for autonomous agents       ║
║  {DIM}MCP Server ready • 4000+ APIs indexed{RESET}{CYAN}                       ║
╚══════════════════════════════════════════════════════════════╝{RESET}
""")
    pause(1)
    
    # Scene 3: Agent query
    instant_print(f"{GRAY}─────────────────────────────────────────────────────────{RESET}")
    instant_print(f"{MAGENTA}🤖 Agent:{RESET} {WHITE}\"I need to send SMS to Swedish phone numbers\"{RESET}")
    instant_print(f"{GRAY}─────────────────────────────────────────────────────────{RESET}")
    pause(0.3)
    
    instant_print(f"\n{YELLOW}⚡ discover_apis{RESET}")
    instant_print(f'{DIM}   query: "send SMS Swedish numbers"{RESET}')
    pause(0.8)
    
    # Scene 4: Results
    instant_print(f"""
{GREEN}✓ Found 3 matching APIs:{RESET}

{BOLD}┌─────────────────────────────────────────────────────────────┐{RESET}
│ {CYAN}46elks{RESET}                                    {GREEN}★★★★★{RESET} {DIM}(SE){RESET}      │
│ Swedish SMS/Voice API • Real credentials available           │
│ {DIM}Pricing: $0.03/SMS • Best for Sweden{RESET}                        │
├─────────────────────────────────────────────────────────────┤
│ {CYAN}Twilio{RESET}                                    {GREEN}★★★★☆{RESET} {DIM}(Global){RESET}  │
│ Global SMS/Voice platform • 180+ countries                   │
│ {DIM}Pricing: $0.05/SMS • Great reliability{RESET}                      │
├─────────────────────────────────────────────────────────────┤
│ {CYAN}Vonage{RESET}                                    {GREEN}★★★★☆{RESET} {DIM}(Global){RESET}  │
│ Enterprise communication APIs                                │
│ {DIM}Pricing: $0.04/SMS • Enterprise focus{RESET}                       │
└─────────────────────────────────────────────────────────────┘
""")
    pause(1.5)
    
    # Scene 5: Purchase
    instant_print(f"{GRAY}─────────────────────────────────────────────────────────{RESET}")
    instant_print(f"{MAGENTA}🤖 Agent:{RESET} {WHITE}\"Purchase 46elks access for $10\"{RESET}")
    instant_print(f"{GRAY}─────────────────────────────────────────────────────────{RESET}")
    pause(0.3)
    
    instant_print(f"\n{YELLOW}⚡ purchase_access{RESET}")
    instant_print(f'{DIM}   api_id: "46elks", amount: $10{RESET}')
    pause(0.5)
    
    # Loading animation
    for i in range(3):
        sys.stdout.write(f"\r{DIM}   Processing{'.' * (i+1)}{RESET}   ")
        sys.stdout.flush()
        time.sleep(0.3)
    print()
    pause(0.3)
    
    # Scene 6: Credentials received
    instant_print(f"""
{GREEN}✓ Purchase complete!{RESET}

{BOLD}┌─────────────────────────────────────────────────────────────┐{RESET}
│ {GREEN}🔑 CREDENTIALS RECEIVED{RESET}                                      │
├─────────────────────────────────────────────────────────────┤
│ Provider:    {CYAN}46elks{RESET}                                          │
│ Type:        Basic Auth                                      │
│ Username:    {WHITE}u8a7f3c2d1e9b4567{RESET}                               │
│ Password:    {WHITE}••••••••••••••••{RESET}                                │
│ Credits:     {GREEN}300 SMS{RESET}                                          │
│ Expires:     Never (pre-paid)                                │
├─────────────────────────────────────────────────────────────┤
│ {DIM}Ready to use immediately. No signup required.{RESET}               │
└─────────────────────────────────────────────────────────────┘
""")
    pause(1.5)
    
    # Scene 7: Agent uses API
    instant_print(f"{GRAY}─────────────────────────────────────────────────────────{RESET}")
    instant_print(f"{MAGENTA}🤖 Agent:{RESET} {WHITE}\"Send SMS: Hello from APIClaw!\"{RESET}")
    instant_print(f"{GRAY}─────────────────────────────────────────────────────────{RESET}")
    pause(0.5)
    
    instant_print(f"""
{GREEN}✓ SMS sent successfully{RESET}

{DIM}┌─────────────────────────────────────────────────────────────┐
│ To: +46705292583                                            │
│ Message: "Hello from APIClaw!"                              │
│ Status: delivered                                           │
│ Cost: 1 credit (299 remaining)                              │
└─────────────────────────────────────────────────────────────┘{RESET}
""")
    pause(1)
    
    # Final message
    instant_print(f"""
{CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}
{BOLD}  APIClaw: From query to working API in 30 seconds.{RESET}
{CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}

  {DIM}npx @nordsym/apiclaw{RESET}  •  {DIM}apiclaw.nordsym.com{RESET}
""")
    pause(2)

if __name__ == "__main__":
    try:
        demo()
    except KeyboardInterrupt:
        print("\n")
        sys.exit(0)
