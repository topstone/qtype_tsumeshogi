<?php
defined('MOODLE_INTERNAL') || die();

class qtype_tsumeshogi extends question_type {

    // ── DB operations ────────────────────────────────────────

    public function get_question_options($question) {
        global $DB;
        $question->options = $DB->get_record(
            'qtype_tsumeshogi_options',
            ['questionid' => $question->id],
            '*', MUST_EXIST
        );
        return true;
    }

    public function save_question_options($question) {
        global $DB;
        $opts = new stdClass();
        $opts->questionid    = $question->id;
        $opts->sfen          = trim($question->sfen);
        $opts->correctanswer = trim($question->correctanswer);

        $existing = $DB->get_record('qtype_tsumeshogi_options', ['questionid' => $question->id]);
        if ($existing) {
            $opts->id = $existing->id;
            $DB->update_record('qtype_tsumeshogi_options', $opts);
        } else {
            $DB->insert_record('qtype_tsumeshogi_options', $opts);
        }
    }

    public function make_question_instance($questiondata) {
        question_bank::load_question_definition_classes($this->name());
        return new qtype_tsumeshogi_question();
    }

    public function initialise_question_instance(question_definition $question, $questiondata) {
        parent::initialise_question_instance($question, $questiondata);
        $question->sfen          = $questiondata->options->sfen;
        $question->correctanswer = $questiondata->options->correctanswer;
    }

    public function get_random_guess_score($questiondata) {
        return 0;
    }

    public function get_possible_responses($questiondata) {
        return [
            $questiondata->id => [
                $questiondata->options->correctanswer => new question_possible_response(
                    $questiondata->options->correctanswer, 1
                ),
                '*'  => new question_possible_response(get_string('incorrectfeedback', 'question'), 0),
                null => question_possible_response::no_response(),
            ],
        ];
    }

    public function delete_question($questionid, $contextid) {
        global $DB;
        $DB->delete_records('qtype_tsumeshogi_options', ['questionid' => $questionid]);
        parent::delete_question($questionid, $contextid);
    }

    // ── Moodle XML Export ────────────────────────────────────
    //
    // Called by the Moodle XML format exporter.
    // Returns a fragment of XML (as a string) for the custom fields of this
    // question type; Moodle wraps it inside the standard <question> block.

    public function export_to_xml($question, qformat_xml $format, $extra = null) {
        $expout  = '';
        $expout .= "    <sfen>" . $format->xml_escape($question->options->sfen) . "</sfen>\n";
        $expout .= "    <correctanswer>" .
                   $format->xml_escape($question->options->correctanswer) .
                   "</correctanswer>\n";
        return $expout;
    }

    // ── Moodle XML Import ────────────────────────────────────
    //
    // Called by the Moodle XML format importer.
    // $data    = the parsed <question> SimpleXML/array node from qformat_xml
    // $question = the partially-built question object
    // Returns the completed question object ready for save_question_options().

    public function import_from_xml($data, $question, qformat_xml $format, $extra = null) {
        // Only handle our own question type tag
        $qtype = $data['@']['type'] ?? ($data['#']['type'][0]['#'] ?? '');
        if ($qtype !== 'tsumeshogi') {
            return false;
        }

        $question = $format->import_headers($data);
        $question->qtype = 'tsumeshogi';

        // Helper: extract first text node from the parsed XML array
        $text = function($node) {
            if (isset($node[0]['#'])) {
                return trim((string)$node[0]['#']);
            }
            return '';
        };

        $question->sfen          = $text($data['#']['sfen'] ?? []);
        $question->correctanswer = $text($data['#']['correctanswer'] ?? []);

        // Validate minimal content
        if ($question->sfen === '') {
            $format->error(get_string('sfen', 'qtype_tsumeshogi') . ': missing in XML');
            return false;
        }
        if ($question->correctanswer === '') {
            $format->error(get_string('correctanswer', 'qtype_tsumeshogi') . ': missing in XML');
            return false;
        }

        return $question;
    }
}
