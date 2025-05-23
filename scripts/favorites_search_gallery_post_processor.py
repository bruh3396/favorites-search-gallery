import argparse
import re
import os


SOURCE_DIRECTORY = "src"
HTML_DIRECTORY = "html"
TYPESCRIPT_HTML_PATH = f"{SOURCE_DIRECTORY}/assets/html.ts"


def get_current_directory() -> str:
    return os.path.dirname(os.path.dirname(__file__))


def get_full_path(path: str) -> str:
    return os.path.join(get_current_directory(), path)


def get_relative_path(path: str) -> str:
    return os.path.relpath(path, get_current_directory())


def read_file(path: str) -> str:
    with open((get_full_path(path)), "r") as file:
        return file.read()


def write_file(path: str, content: str):
    with open(get_full_path(path), "w") as file:
        file.write(content)


def convert_snake_case_to_camel_case(variable_name: str) -> str:
    return re.sub(r"_(\S)", lambda match: match.group(1).upper(), variable_name)


def get_html_variable_name(html_path: str) -> str:
    variable_name = os.path.basename(html_path).replace(".html", "")
    # return convert_snake_case_to_camel_case(variable_name)k
    return variable_name.upper() + "_HTML"


def get_web_worker_variable_name(web_worker_path: str) -> str:
    variable_name = os.path.basename(web_worker_path).replace(".js", "")
    return convert_snake_case_to_camel_case(variable_name)


def insert_html_into_typescript_content(html_variable_name: str, html_content: str, typescript_content: str) -> str:
    return re.sub(
        rf"{html_variable_name}[\s\n\t]*:[\s\n\t]*`.*?`",
        rf"{html_variable_name} = `\n{html_content}\n`",
        typescript_content,
        flags=re.DOTALL,
    )


def get_html_full_path(html_path: str) -> str:
    return os.path.join(get_full_path(HTML_DIRECTORY), html_path)


def read_html_file(html_path: str) -> str:
    return read_file(get_html_full_path(html_path))


def get_html_typescript_decalration(html_path_content_pair: tuple[str, str]) -> str:
    html_path, html_content = html_path_content_pair
    html_variable_name = get_html_variable_name(html_path)
    typescript_declaration = f"export const {html_variable_name} = `\n{html_content}\n`;"
    return typescript_declaration


def build_typescript_html_file() -> None:
    html_paths = os.listdir(get_full_path(HTML_DIRECTORY))
    html_content_map = [(path, read_html_file(path)) for path in html_paths]
    typescript_content = "\n".join([get_html_typescript_decalration(html_path_content_pair) for html_path_content_pair in html_content_map]) + "\n"
    write_file(TYPESCRIPT_HTML_PATH, typescript_content)


def inject_web_worker_into_typescript_file(web_worker_path: str) -> None:
    typescript_path = "js/common/static/web_workers.js"
    web_worker_content = read_file(web_worker_path)
    typescript_content = read_file(typescript_path)
    web_worker_variable_name = get_web_worker_variable_name(web_worker_path)
    typescript_content_with_web_worker_injected = re.sub(
        rf"{web_worker_variable_name}:[\s\n\t]*`.*?`",
        rf"{web_worker_variable_name}:\n`\n{web_worker_content}\n`",
        typescript_content,
        flags=re.DOTALL,
    )
    write_file(typescript_path, typescript_content_with_web_worker_injected)


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="Favorites Search Gallery", description="Favorites Search Gallery Post Processor")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("-l", "--html", action="store_true")
    group.add_argument("-w", "--worker")
    group.add_argument("-t", "--tampermonkey", action="store_true")
    return parser.parse_args()


def on_file_changed() -> None:
    arguments = parse_arguments()

    if arguments.html:
        build_typescript_html_file()
    elif arguments.worker:
        inject_web_worker_into_typescript_file(arguments.worker)

    print("Post processing completed.")


if __name__ == "__main__":
    on_file_changed()
