/**
 * Created by immanuelpelzer on 10.03.17.
 */
export class Color {
  static colorForTable(tableName : string) : string {
    switch (tableName) {
      case "content_ausstellung":
        return "green";
      case "content_kooperation":
        return "orange";
      case "content_mitglied":
        return "Lavender";
      case "content_nachwuchsfoerderung":
        return "yellow";
      case "content_newsletter":
        return "purple";
      case "content_podcast":
        return "orange";
      case "content_post":
        return "orange";
      case "content_pressemitteilung":
        return "orange";
      case "content_projekt":
        return "DarkCyan";
      case "content_publikation":
        return "FireBrick";

    }
  }
}
