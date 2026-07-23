import os
import sys
import subprocess
import urllib.request
import json

def run_cmd(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.returncode, result.stdout.strip(), result.stderr.strip()

def main():
    print("=" * 60)
    print(" 🚀 치지직 추첨기 - GitHub 자동 업로드 도구")
    print("=" * 60)
    print()
    
    username = input("👉 본인의 GitHub 아이디(사용자명)를 입력하세요: ").strip()
    if not username:
        print("❌ 아이디가 입력되지 않았습니다.")
        input("엔터를 누르면 종료됩니다...")
        sys.exit(1)

    print()
    print("🔑 GitHub 개인 액세스 토큰(Personal Access Token)이 있으신가요?")
    print("   (토큰이 있으면 깃허브 웹사이트에 들어가지 않고도 원클릭으로 레포지토리를 자동 생성합니다.)")
    token = input("👉 GitHub 토큰 입력 (없으면 그냥 엔터): ").strip()

    repo_name = "chzzk-raffle-app"

    # If token is provided, auto-create repository on GitHub via REST API
    if token:
        print("\n🌐 GitHub API를 통해 레포지토리 자동 생성 중...")
        url = "https://api.github.com/user/repos"
        payload = json.dumps({"name": repo_name, "public": True, "description": "치지직 대규모 시청자 추첨 시스템"}).encode('utf-8')
        req = urllib.request.Request(url, data=payload, headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        })
        try:
            with urllib.request.urlopen(req) as resp:
                print("✅ 깃허브 레포지토리 생성 성공!")
        except Exception as e:
            print(f"ℹ️ 레포지토리가 이미 존재하거나 안내: {e}")

        remote_url = f"https://{username}:{token}@github.com/{username}/{repo_name}.git"
    else:
        remote_url = f"https://github.com/{username}/{repo_name}.git"

    # Git commands
    run_cmd("git init")
    run_cmd("git config user.name " + username)
    run_cmd("git config user.email " + username + "@users.noreply.github.com")
    run_cmd("git add .")
    run_cmd('git commit -m "Initial commit: Chzzk Mega Raffle System"')
    run_cmd("git branch -M main")
    run_cmd(f"git remote remove origin")
    run_cmd(f"git remote add origin {remote_url}")

    print("\n📤 GitHub로 코드 업로드 (git push) 진행 중...")
    code, out, err = run_cmd("git push -u origin main")

    if code == 0:
        print("\n" + "=" * 60)
        print(" 🎉 GitHub 업로드에 성공했습니다!")
        print(f" 🔗 저장소 주소: https://github.com/{username}/{repo_name}")
        print("=" * 60)
    else:
        print("\n⚠️ 업로드 중 안내/인증 메시지:")
        print(err or out)
        print("\n💡 깃허브에 레포지토리가 먼저 만들어져 있어야 합니다.")
        print(f"   웹브라우저에서 https://github.com/new 접속 후 '{repo_name}' 레포지토리를 생성해주세요.")

    print()
    input("엔터 키를 누르면 종료됩니다...")

if __name__ == '__main__':
    main()
